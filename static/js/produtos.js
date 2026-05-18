(function () {
  function formatMoney(value) {
    value = value.replace(/\D/g, "");
    value = (Number(value) / 100).toFixed(2);
    value = value.replace(".", ",");
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return value;
  }

  document.querySelectorAll(".money").forEach(input => {
    input.addEventListener("input", function () {
      this.value = formatMoney(this.value);
    });
  });
})();
