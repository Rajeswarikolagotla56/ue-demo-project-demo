import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // --- Universal Editor instrumentation on the block (container) ---
  block.setAttribute('data-aue-resource', 'urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container/cards');
  block.setAttribute('data-aue-type', 'container');
  block.setAttribute('data-aue-label', 'Cards');
  block.setAttribute('data-aue-behavior', 'component');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    // Instrument each card row as an individual component
    li.setAttribute('data-aue-resource', `urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container/cards/item${index}`);
    li.setAttribute('data-aue-type', 'component');
    li.setAttribute('data-aue-label', `Card ${index + 1}`);

    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
        // Instrument title and description inside each card
        const title = div.querySelector('h1, h2, h3, h4, h5, h6');
        if (title) {
          title.setAttribute('data-aue-resource', `urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container/cards/item${index}`);
          title.setAttribute('data-aue-prop', 'title');
          title.setAttribute('data-aue-type', 'richtext');
          title.setAttribute('data-aue-label', `Card ${index + 1} Title`);
        }
        const desc = div.querySelector('p');
        if (desc) {
          desc.setAttribute('data-aue-resource', `urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container/cards/item${index}`);
          desc.setAttribute('data-aue-prop', 'description');
          desc.setAttribute('data-aue-type', 'richtext');
          desc.setAttribute('data-aue-label', `Card ${index + 1} Text`);
        }
      }
      // Instrument the image within the card
      const img = div.querySelector('picture, img');
      if (img) {
        img.setAttribute('data-aue-resource', `urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container/cards/item${index}`);
        img.setAttribute('data-aue-prop', 'image');
        img.setAttribute('data-aue-type', 'media');
        img.setAttribute('data-aue-label', `Card ${index + 1} Image`);
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
