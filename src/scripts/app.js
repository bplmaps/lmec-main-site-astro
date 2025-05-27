document.addEventListener("DOMContentLoaded", function(){
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
});
