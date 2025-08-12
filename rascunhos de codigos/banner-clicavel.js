<script>
document.addEventListener("DOMContentLoaded", function() {
  document.body.addEventListener("click", function(event) {
    
    // Ignora cliques nas setas de navegação do banner.
    if (event.target.closest('.video-control')) {
      return; 
    }

    const slideClicado = event.target.closest('.swiper-slide');

    if (!slideClicado) {
      return;
    }
    
    const indexDoSlide = slideClicado.dataset.index;

    // Index inicia em 0 = Banner 1, index 1 = banner 2
    if (indexDoSlide === '0') {
      const link = "https://sndflw.com/i/5l7fZNenRcW131Qq1qAy";
      window.open(link, "_blank");
      return;
    }

  }, true);

  const style = document.createElement('style');
  if (!document.getElementById('banner-click-styles')) {
    style.id = 'banner-click-styles';
    
    style.innerHTML = `
        .swiper-slide[data-index="0"] {
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
  }
});
</script>