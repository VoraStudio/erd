// Animaciones del hero de la Home, con GSAP:
//   1. El logotipo con la foto en las letras entra muy ampliado y se encoge hasta su tamaño.
//   2. El titular («Menys intuïció. Més resultats.») aparece línea a línea con una cortina de abajo hacia arriba:
//      SplitText parte el texto en líneas y pone cada una dentro de una máscara (mask: 'lines'); cada línea sube
//      desde abajo, primero una y luego la otra (stagger), empezando antes de que acabe el zoom.
//   3. El texto de la derecha aparece con un fundido desde abajo, unos segundos antes de que acabe la cortina.
// El estado inicial (logotipo ampliado, titular oculto) lo pone el CSS para evitar parpadeos; aquí GSAP hace
// todo el movimiento.

const SEGUNDOS_ZOOM = 2.2;
const ESPERA_MAXIMA_FOTO_MS = 2500;

const SEGUNDOS_LINEA = 0.9;
const ESCALONADO_LINEAS = 0.25;
// El titular empieza estos segundos antes de que acabe el zoom, para que se encadenen sin esperas.
const SOLAPE_TITULAR_SEGUNDOS = 0.6;

const SEGUNDOS_TEXTO = 0.8;
const DESPLAZAMIENTO_TEXTO = 40;
// El texto de la derecha empieza estos segundos antes de que acabe la cortina del titular.
const ADELANTO_TEXTO_SEGUNDOS = 0.8;

// Cuándo acaba la cortina del titular, contando desde que empieza el zoom (la última línea es la que tarda más).
const FIN_CORTINA_SEGUNDOS = SEGUNDOS_ZOOM - SOLAPE_TITULAR_SEGUNDOS + SEGUNDOS_LINEA + ESCALONADO_LINEAS;

// Si GSAP no carga, el logotipo se queda en su tamaño normal en vez de ampliado.
function dejarEnSuTamano(logo) {
  logo.classList.add('is-settled');
}

// El CSS oculta el titular y el texto (visibility: hidden); el estilo en línea gana y los deja a la vista.
function mostrarElemento(elemento) {
  elemento.style.visibility = 'visible';
}

// La foto tiene que estar lista antes de animar: si no, se verían las letras rojas vacías.
function esperarFoto(foto) {
  const limite = new Promise((resolver) => setTimeout(resolver, ESPERA_MAXIMA_FOTO_MS));
  return Promise.race([foto.decode().catch(() => {}), limite]);
}

export async function iniciarAnimacionesDelHero() {
  const logo = document.querySelector('[data-hero-zoom]');
  if (!logo) {
    return;
  }

  const titular = document.querySelector('[data-hero-titular]');
  const texto = document.querySelector('[data-hero-texto]');

  const { gsap, SplitText } = window;
  if (!gsap || !SplitText) {
    dejarEnSuTamano(logo);
    mostrarElemento(titular);
    mostrarElemento(texto);
    return;
  }

  // Con movimiento reducido el CSS no oculta ni amplía nada y no se anima nada: el hero ya está en su sitio.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  gsap.registerPlugin(SplitText);

  await esperarFoto(logo.querySelector('img'));

  const escalaInicial = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-zoom-scale'));

  gsap.fromTo(
    logo,
    { scale: escalaInicial },
    { scale: 1, duration: SEGUNDOS_ZOOM, ease: 'power3.out', onComplete: () => dejarEnSuTamano(logo) },
  );

  // autoSplit vuelve a partir el texto si cambian las líneas (al cambiar el ancho de la ventana o al cargar
  // la fuente). La animación que devuelve onSplit se rehace sola, conservando por dónde iba.
  SplitText.create(titular, {
    type: 'lines',
    mask: 'lines',
    // SplitText le pone a cada máscara la clase de su línea + «-mask»: aquí, hero-line-mask (ver pages.css).
    linesClass: 'hero-line',
    autoSplit: true,
    onSplit: (division) => {
      // gsap.from deja ya cada línea abajo, bajo su máscara, antes de hacer visible el titular.
      // Baja 130 % (y no 100 %): la máscara tiene un relleno por abajo y la línea tiene que quedar fuera de él.
      const cortina = gsap.from(division.lines, {
        yPercent: 130,
        duration: SEGUNDOS_LINEA,
        ease: 'power3.out',
        stagger: ESCALONADO_LINEAS,
        delay: SEGUNDOS_ZOOM - SOLAPE_TITULAR_SEGUNDOS,
      });
      mostrarElemento(titular);
      return cortina;
    },
  });

  // Texto de la derecha: fundido desde abajo. autoAlpha también controla la visibilidad, así que sustituye
  // al visibility: hidden del CSS.
  gsap.fromTo(
    texto,
    { autoAlpha: 0, y: DESPLAZAMIENTO_TEXTO },
    {
      autoAlpha: 1,
      y: 0,
      duration: SEGUNDOS_TEXTO,
      ease: 'power2.out',
      delay: FIN_CORTINA_SEGUNDOS - ADELANTO_TEXTO_SEGUNDOS,
      clearProps: 'transform',
    },
  );
}
