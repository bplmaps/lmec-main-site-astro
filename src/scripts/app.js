document.addEventListener("DOMContentLoaded", function() {
  // Add link to return to in-text footnote to each endnote
  const endnotes = document.querySelectorAll('[data-endnote]');

  endnotes.forEach((endnote) => {
    const endnoteNum = endnote.getAttribute('data-endnote');
    const footnote = document.querySelector('[data-footnote="' + endnoteNum + '"]')

    if (footnote) {
      const endnoteRefLink = document.createElement('a');

      endnoteRefLink.href = '#';
      endnoteRefLink.innerText = '↩︎';
      endnoteRefLink.className = 'footnote-backref';
      endnoteRefLink.setAttribute('role', 'doc-backlink');
      endnote.parentElement.append(endnoteRefLink);

      endnoteRefLink.addEventListener('click', (e) => {
        e.preventDefault();

        footnote.scrollIntoView();
      })
    }
  });

  // Add popup hover images
  const popupImageTriggers = document.querySelectorAll('a[data-popup][href]');

  popupImageTriggers.forEach((popupImageTrigger) => {
    const popupImageTooltip = document.createElement('div');
    const xOffset = 100;
    const yOffset = -20;

    popupImageTooltip.classList.add('iiif-popup');

    const imageHref = popupImageTrigger.getAttribute('href');

    if (imageHref) {
      popupImageTrigger.classList.add('popup-tooltip');

      const bibSrc = popupImageTrigger.getAttribute('data-bib-src');
      popupImageTrigger.addEventListener('click', function(e) {
        e.preventDefault();

        if (bibSrc) {
          window.open(
            bibSrc,
            '_blank',
          );
        }
      });

      const popupImage = document.createElement('img');
      popupImage.setAttribute('src', imageHref);
      popupImageTooltip.append(popupImage);

      const nbsp = document.createTextNode(' ');
      popupImageTrigger.prepend(nbsp);

      const externalLinkIcon = document.createElement('i');
      externalLinkIcon.classList.add('fas', 'fa-external-link-alt');
      popupImageTrigger.prepend(externalLinkIcon);

      popupImageTrigger.addEventListener('mouseenter', function() {
        document.body.append(popupImageTooltip);
      });

      popupImageTrigger.addEventListener('mouseleave', function() {
        popupImageTooltip.remove();
      });

      popupImageTrigger.addEventListener('mousemove', function(e) {
        popupImageTooltip.style.top = (e.pageY - xOffset) + 'px';
        popupImageTooltip.style.left = (e.pageX - yOffset) + 'px';
      });
    }
  });
});
