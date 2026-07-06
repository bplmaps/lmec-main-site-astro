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

      // Inline SVG (Font Awesome arrow-up-right-from-square path) — the FA
      // stylesheet is no longer loaded, so icons must be embedded directly
      const externalLinkIcon = document.createElement('span');
      externalLinkIcon.innerHTML = '<svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" style="width:1em"><path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l82.7 0L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3l0 82.7c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160c0-17.7-14.3-32-32-32L320 0zM80 32C35.8 32 0 67.8 0 112L0 432c0 44.2 35.8 80 80 80l320 0c44.2 0 80-35.8 80-80l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16L80 448c-8.8 0-16-7.2-16-16l0-320c0-8.8 7.2-16 16-16l112 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 32z"/></svg>';
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
