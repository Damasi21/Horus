(function () {
  const camposPercentuais = document.querySelectorAll(".percentual");
  const totalCustos = document.getElementById("totalCustosProvisoes");

  function formatPercentual(value) {
    value = value.replace(/\D/g, "");
    value = (Number(value) / 100).toFixed(2);
    return value.replace(".", ",");
  }

  function parsePercentual(value) {
    return Number((value || "0").replace(/\./g, "").replace(",", ".")) || 0;
  }

  function formatResultado(value) {
    return value.toFixed(2).replace(".", ",");
  }

  function atualizarTotalCustos() {
    if (!totalCustos) return;

    const total = Array.from(camposPercentuais).reduce((soma, campo) => {
      return soma + parsePercentual(campo.value);
    }, 0);

    totalCustos.value = formatResultado(total);
  }

  if (camposPercentuais.length) {
    camposPercentuais.forEach(input => {
      input.addEventListener("input", function () {
        this.value = formatPercentual(this.value);
        atualizarTotalCustos();
      });
    });

    atualizarTotalCustos();
    return;
  }

  const tbody = document.getElementById("tbodyCenarios");
  const btnSalvar = document.getElementById("btnSalvarCenario");
  if (!tbody || !btnSalvar) return;

  const cenarios = [];

  function render() {
    tbody.innerHTML = "";
    if (cenarios.length === 0) {
      tbody.innerHTML = `<tr class="text-muted"><td colspan="4">Sem dados (por enquanto).</td></tr>`;
      return;
    }

    cenarios.forEach((c, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${c.aliquota}%</td>
        <td>${c.obs || ""}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" data-idx="${idx}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("button[data-idx]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-idx"));
        cenarios.splice(i, 1);
        render();
      });
    });
  }

  btnSalvar.addEventListener("click", () => {
    const nome = (document.getElementById("nomeCenario").value || "").trim();
    const aliquota = (document.getElementById("aliquota").value || "").trim();
    const obs = (document.getElementById("obs").value || "").trim();

    if (!nome) return alert("Informe o nome do cenário.");
    cenarios.push({ nome, aliquota: aliquota || "0,00", obs });
    render();
  });

  render();
})();
