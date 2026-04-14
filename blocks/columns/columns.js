export default function decorate(block) {
  // --- Universal Editor instrumentation ---
  block.setAttribute('data-aue-resource', 'urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container/columns');
  block.setAttribute('data-aue-type', 'container');
  block.setAttribute('data-aue-label', 'Columns');
  block.setAttribute('data-aue-behavior', 'component');

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row, rowIndex) => {
    [...row.children].forEach((col, colIndex) => {
      // Instrument each column item
      const itemResource = `urn:aemconnection:/content/ue-demo-project-demo/jcr:content/root/container/columns/item${rowIndex}_${colIndex}`;
      col.setAttribute('data-aue-resource', itemResource);
      col.setAttribute('data-aue-type', 'component');
      col.setAttribute('data-aue-label', `Column ${colIndex + 1}`);

      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
        // Instrument image
        const img = pic.querySelector('img');
        if (img) {
          img.setAttribute('data-aue-resource', itemResource);
          img.setAttribute('data-aue-prop', 'image');
          img.setAttribute('data-aue-type', 'media');
        }
      }

      // Instrument text elements
      const title = col.querySelector('h1, h2, h3, h4, h5, h6');
      if (title) {
        title.setAttribute('data-aue-resource', itemResource);
        title.setAttribute('data-aue-prop', 'title');
        title.setAttribute('data-aue-type', 'richtext');
      }
      const desc = col.querySelector('p:not(.columns-img-col)');
      if (desc) {
        desc.setAttribute('data-aue-resource', itemResource);
        desc.setAttribute('data-aue-prop', 'description');
        desc.setAttribute('data-aue-type', 'richtext');
      }
    });
  });
}
