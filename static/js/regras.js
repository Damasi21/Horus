(function () {
  const tbody = document.getElementById("tbodyRegras");
  const btnSalvar = document.getElementById("btnSalvarRegra");

  if (!tbody || !btnSalvar) return;

  const regras = [];

  function textoResultado(valor) {
    if (valor === "prejuizo") return "🔴 PREJUÍZO OPERACIONAL";
    if (valor === "abaixo_meta") return "🟡 ABAIXO DA META";
    if (valor === "saudavel") return "🟢 SAUDÁVEL";
    return "";
  }

  function render() {
    tbody.innerHTML = "";

    if (regras.length === 0) {
      tbody.innerHTML = `
        <tr class="text-muted">
          <td colspan="4">Nenhuma regra cadastrada.</td>
        </tr>
      `;
      return;
    }

    regras.forEach((regra, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${regra.de}</td>
        <td>${regra.ate}</td>
        <td>${textoResultado(regra.resultado)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" data-index="${index}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("button[data-index]").forEach(btn => {
      btn.addEventListener("click", function () {
        const index = Number(this.getAttribute("data-index"));
        regras.splice(index, 1);
        render();
      });
    });
  }

  btnSalvar.addEventListener("click", function () {
    const de = document.getElementById("valorInicial").value.trim();
    const ate = document.getElementById("valorFinal").value.trim();
    const resultado = document.getElementById("resultadoRegra").value;

    if (!de || !ate || !resultado) {
      alert("Preencha todos os campos da regra.");
      return;
    }

    regras.push({ de, ate, resultado });
    render();

    document.getElementById("valorInicial").value = "";
    document.getElementById("valorFinal").value = "";
    document.getElementById("resultadoRegra").value = "";
  });

  render();
})();