import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

// Load Universal Editor on .aem.page (preview) and localhost
if (window.location.hostname.endsWith('.aem.page') || window.location.hostname === 'localhost') {
  const script = document.createElement('script');
  script.src = '/universal-editor-cors.js';
  document.head.appendChild(script);

  // Mock backend: intercept Universal Editor postMessage events and handle locally
  // This allows UE editing to work without a real AEM JCR backend.
  window.addEventListener('message', (event) => {
    const { type, detail } = event.data || {};

    // Handle content fetch — return current DOM value or specific props
    if (type === 'ue:get') {
      const { resource, prop } = detail || {};
      const el = document.querySelector(`[data-aue-resource="${resource}"] [data-aue-prop="${prop}"], [data-aue-prop="${prop}"]`);
      let value = '';
      if (el) {
        if (el.tagName === 'IMG') value = el.src;
        else value = el.textContent;
      }
      event.source?.postMessage({ type: 'ue:get:response', id: event.data.id, data: { [prop]: value } }, '*');
    }

    // Handle content update — apply to DOM and confirm success
    if (type === 'ue:patch' || type === 'aue:content:update') {
      const { resource, prop, value, detail: innerDetail } = detail || {};
      const updates = (innerDetail && innerDetail.content) || (detail && detail.content) || [{ prop, value }];
      
      updates.forEach((update) => {
        const p = update.prop;
        const v = update.value;
        // Search globally or within the resource
        const el = document.querySelector(`[data-aue-resource="${resource}"] [data-aue-prop="${p}"], [data-aue-prop="${p}"]`);
        if (el) {
          if (el.tagName === 'IMG') {
            el.src = v;
          } else if (el.tagName === 'PICTURE') {
            const img = el.querySelector('img');
            if (img) img.src = v;
          } else {
            el.textContent = v;
          }
        }
      });
      event.source?.postMessage({ type: 'ue:patch:response', id: event.data.id, status: 'ok' }, '*');
      event.source?.postMessage({ type: 'aue:content:updated', detail: { resource, prop } }, '*');
    }

    // Handle connection check
    if (type === 'ue:ping') {
      event.source?.postMessage({ type: 'ue:pong', id: event.data.id }, '*');
    }
  });
}


/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // --- Universal Editor instrumentation for Page level ---
  main.setAttribute('data-aue-resource', 'urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container');
  main.setAttribute('data-aue-type', 'container');
  main.setAttribute('data-aue-label', 'Main Content');

  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);

  // Instrument each section
  [...main.querySelectorAll('.section')].forEach((section, index) => {
    section.setAttribute('data-aue-resource', `urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container/section${index}`);
    section.setAttribute('data-aue-type', 'container');
    section.setAttribute('data-aue-label', `Section ${index + 1}`);
  });
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
