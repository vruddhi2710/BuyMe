$(function () {

    if ($('textarea#ta').length) {
        CKEDITOR.replace('ta');
    }

    $('a.confirmDeletion').on('click', function () {
        if (!confirm('Confirm deletion'))
            return false;
    });
    
    if ($("[data-fancybox]").length) {
        $("[data-fancybox]").fancybox();
    }

});
async function getCategories()
{
    console.log("In finction get categories")
    url="/admin/categories/add-category";
    fetch(url).then(response => response.json())
    .then(json => console.log(json))
    .catch(error => {
        console.error('Error:', error);
    });

}
const deleteButton = document.querySelector('#delete-btn-category')

deleteButton.addEventListener('click', _ => {
    fetch('/admin/categories/delete-category', {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Footwear'
    })
  })
    .then(res => {
      if (res.ok) return res.json()
    })
    .then(data => {
      window.location.reload()
    })
})