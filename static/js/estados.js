(function () {
  const configuracoesEl = document.getElementById("configuracoes-estados");
  const configuracoes = configuracoesEl ? JSON.parse(configuracoesEl.textContent) : {};
  const botoesPersistentes = document.querySelectorAll(".estado-btn");
  const painelPersistente = document.getElementById("painelEstado");
  const estadoSelecionadoPersistente = document.getElementById("estadoSelecionado");
  const ufEstado = document.getElementById("ufEstado");
  const campoDifal = document.getElementById("campoDifal");
  const difalEstado = document.getElementById("difalEstado");
  const icmsEstado = document.getElementById("icmsEstado");
  const btnSalvarPersistente = document.getElementById("btnSalvarEstado");
  let ufAtualPersistente = "";

  if (!botoesPersistentes.length || !painelPersistente || !estadoSelecionadoPersistente || !ufEstado || !campoDifal || !difalEstado || !icmsEstado || !btnSalvarPersistente) return;

  function formatPercentual(value) {
    value = value.replace(/\D/g, "");
    value = (Number(value) / 100).toFixed(2);
    return value.replace(".", ",");
  }

  function atualizarCampoDifal() {
    const isSp = ufAtualPersistente === "SP";
    campoDifal.style.display = isSp ? "none" : "";
    difalEstado.required = !isSp;

    if (isSp) {
      difalEstado.value = "";
    }
  }

  document.querySelectorAll(".percentual").forEach(input => {
    input.addEventListener("input", function () {
      this.value = formatPercentual(this.value);
    });
  });

  botoesPersistentes.forEach(botao => {
    botao.addEventListener("click", function () {
      ufAtualPersistente = this.getAttribute("data-uf");
      const valores = configuracoes[ufAtualPersistente] || {};

      botoesPersistentes.forEach(btn => {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-outline-primary");
      });
      this.classList.remove("btn-outline-primary");
      this.classList.add("btn-primary");

      estadoSelecionadoPersistente.textContent = ufAtualPersistente;
      ufEstado.value = ufAtualPersistente;
      difalEstado.value = valores.difal || "";
      icmsEstado.value = valores.icms || "";
      atualizarCampoDifal();
      painelPersistente.style.display = "block";
    });
  });

  btnSalvarPersistente.closest("form").addEventListener("submit", function (event) {
    const ufSelecionada = ufEstado.value.trim();

    if (!ufSelecionada) {
      event.preventDefault();
      alert("Selecione um estado.");
      return;
    }

    if (ufSelecionada !== "SP" && !difalEstado.value.trim()) {
      event.preventDefault();
      alert("Preencha DIFAL e ICMS.");
      return;
    }

    if (!icmsEstado.value.trim()) {
      event.preventDefault();
      alert("Preencha ICMS.");
    }
  });

  return;

  const botoes = document.querySelectorAll(".estado-btn");
  const painel = document.getElementById("painelEstado");
  const estadoSelecionado = document.getElementById("estadoSelecionado");
  const btnSalvar = document.getElementById("btnSalvarEstado");

  let ufAtual = "";

  if (!botoes.length || !painel || !estadoSelecionado || !btnSalvar) return;

  botoes.forEach(botao => {
    botao.addEventListener("click", function () {
      ufAtual = this.getAttribute("data-uf");
      estadoSelecionado.textContent = ufAtual;
      painel.style.display = "block";
    });
  });

  btnSalvar.addEventListener("click", function () {
    const difal = document.getElementById("difalEstado").value.trim();
    const icms = document.getElementById("icmsEstado").value.trim();

    if (!ufAtual) {
      alert("Selecione um estado.");
      return;
    }

    if (!difal || !icms) {
      alert("Preencha DIFAL e ICMS.");
      return;
    }

    alert(`Configuração salva (mock): ${ufAtual} | DIFAL: ${difal}% | ICMS: ${icms}%`);
  });
})();
