(function () {

  function parseBRL(v) {
    if (!v) return 0;
    return Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;
  }

  function fmtBRL(n) {
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function fmtNumeroBR(n) {
    return n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function valorCampo(id) {
    const el = document.getElementById(id);
    return el ? parseBRL(el.value) : 0;
  }

  const btnCalcular = document.getElementById("btnCalcular");
  const btnLimpar = document.getElementById("btnLimpar");
  const btnAdicionarProduto = document.getElementById("btnAdicionarProduto");
  const linhasProdutos = document.getElementById("linhasProdutos");
  const cenarioSelect = document.getElementById("cenarioSelect");
  const provisaoGastosFixosInput = document.getElementById("provisaoGastosFixos");
  const estadoSelect = document.getElementById("estadoSelect");
  const valorTotalProdutos = document.getElementById("valorTotalProdutos");

  if (!btnCalcular) return;

  function calcularSubtotalLinha(linha) {
    const custo = parseBRL(linha.querySelector(".custo-produto")?.value);
    const quantidade = parseBRL(linha.querySelector(".quantidade-produto")?.value);
    const subtotal = custo * quantidade;
    const subtotalInput = linha.querySelector(".subtotal-produto");

    if (subtotalInput) {
      subtotalInput.value = fmtNumeroBR(subtotal);
    }

    return subtotal;
  }

  function calcularTotalProdutos() {
    return Array.from(document.querySelectorAll(".linha-produto"))
      .reduce((total, linha) => total + calcularSubtotalLinha(linha), 0);
  }

  function calcularTotalVendaProdutos() {
    return Array.from(document.querySelectorAll(".linha-produto"))
      .reduce((total, linha) => {
        const valorVenda = parseBRL(linha.querySelector(".valor-venda-produto")?.value);
        const quantidade = parseBRL(linha.querySelector(".quantidade-produto")?.value);
        return total + (valorVenda * quantidade);
      }, 0);
  }

  function calcularAliquotasEstado() {
    const cenario = cenarioSelect?.selectedOptions[0];
    const estado = estadoSelect?.selectedOptions[0];

    if (!cenario?.value || !estado?.value) return 0;

    const icms = parseBRL(estado.dataset.icms);
    const difal = parseBRL(estado.dataset.difal);

    return cenario.dataset.contribuinte === "sim"
      ? icms
      : icms + difal;
  }

  function calcularTotalCustosProvisoes() {
    const opcao = cenarioSelect?.selectedOptions[0];
    const totalCenario = parseBRL(opcao?.dataset.totalCustosProvisoes);
    const provisaoCenario = parseBRL(opcao?.dataset.provisaoGastosFixos);
    const provisaoTela = valorCampo("provisaoGastosFixos");
    const aliquotasEstado = calcularAliquotasEstado();

    return Math.max(totalCenario - provisaoCenario + provisaoTela, 0) + aliquotasEstado;
  }

  function atualizarTotalProdutos() {
    const total = calcularTotalProdutos();

    if (valorTotalProdutos) {
      valorTotalProdutos.textContent = fmtBRL(total);
    }

    return total;
  }

  function prepararLinhaProduto(linha) {
    const produtoSelect = linha.querySelector(".produto-select");
    const quantidadeInput = linha.querySelector(".quantidade-produto");

    produtoSelect?.addEventListener("change", function () {
      const opcao = this.selectedOptions[0];
      const custo = opcao?.dataset.custo || "0,00";
      const valorVenda = opcao?.dataset.valorVenda || "0,00";
      linha.querySelector(".custo-produto").value = custo;
      linha.querySelector(".valor-venda-produto").value = valorVenda;
      calcularSubtotalLinha(linha);
      atualizarTotalProdutos();
    });

    quantidadeInput?.addEventListener("input", function () {
      calcularSubtotalLinha(linha);
      atualizarTotalProdutos();
    });
  }

  document.querySelectorAll(".linha-produto").forEach(prepararLinhaProduto);

  cenarioSelect?.addEventListener("change", function () {
    const opcao = this.selectedOptions[0];
    provisaoGastosFixosInput.value = opcao?.dataset.provisaoGastosFixos || "0,00";
  });

  linhasProdutos?.addEventListener("change", function (event) {
    const produtoSelect = event.target.closest(".produto-select");
    if (!produtoSelect) return;

    const linha = produtoSelect.closest(".linha-produto");
    if (!linha) return;

    const opcao = produtoSelect.selectedOptions[0];
    const custo = opcao?.dataset.custo || "0,00";
    const valorVenda = opcao?.dataset.valorVenda || "0,00";
    linha.querySelector(".custo-produto").value = custo;
    linha.querySelector(".valor-venda-produto").value = valorVenda;
    calcularSubtotalLinha(linha);
    atualizarTotalProdutos();
  });

  linhasProdutos?.addEventListener("input", function (event) {
    const quantidadeInput = event.target.closest(".quantidade-produto");
    if (!quantidadeInput) return;

    const linha = quantidadeInput.closest(".linha-produto");
    if (linha) {
      calcularSubtotalLinha(linha);
      atualizarTotalProdutos();
    }
  });

  btnAdicionarProduto?.addEventListener("click", function () {
    const primeiraLinha = linhasProdutos?.querySelector(".linha-produto");
    if (!primeiraLinha) return;

    const novaLinha = primeiraLinha.cloneNode(true);
    novaLinha.querySelector(".produto-select").value = "";
    novaLinha.querySelector(".custo-produto").value = "0,00";
    novaLinha.querySelector(".valor-venda-produto").value = "0,00";
    novaLinha.querySelector(".quantidade-produto").value = "";
    novaLinha.querySelector(".subtotal-produto").value = "0,00";

    linhasProdutos.appendChild(novaLinha);
    atualizarTotalProdutos();
  });

  linhasProdutos?.addEventListener("click", function (event) {
    const botaoRemover = event.target.closest(".remover-linha-produto");
    if (!botaoRemover) return;

    const linhas = linhasProdutos.querySelectorAll(".linha-produto");
    const linha = botaoRemover.closest(".linha-produto");

    if (linhas.length === 1) {
      linha.querySelector(".produto-select").value = "";
      linha.querySelector(".custo-produto").value = "0,00";
      linha.querySelector(".valor-venda-produto").value = "0,00";
      linha.querySelector(".quantidade-produto").value = "";
      linha.querySelector(".subtotal-produto").value = "0,00";
      atualizarTotalProdutos();
      return;
    }

    linha?.remove();
    atualizarTotalProdutos();
  });

  btnCalcular.addEventListener("click", function () {

    if (cenarioSelect?.value && !estadoSelect?.value) {
      alert("Selecione o estado para aplicar ICMS e DIFAL.");
      return;
    }

    const custoProduto = atualizarTotalProdutos();
    const precoVenda = calcularTotalVendaProdutos();
    const provisaoGastosFixos = valorCampo("provisaoGastosFixos");
    const totalCustosProvisoes = calcularTotalCustosProvisoes();

    const margemBruta = precoVenda > 0
      ? ((precoVenda - custoProduto) / precoVenda) * 100
      : 0;

    const margemContribuicao = margemBruta - totalCustosProvisoes;
    const lucroLiquido = margemContribuicao - provisaoGastosFixos;

    const markup = totalCustosProvisoes < 100
      ? 100 / (100 - totalCustosProvisoes)
      : 0;

    document.getElementById("resMargemBruta").textContent = margemBruta.toFixed(2) + "%";
    document.getElementById("resMargemContribuicao").textContent = margemContribuicao.toFixed(2) + "%";
    document.getElementById("resLucroLiquido").textContent = lucroLiquido.toFixed(2) + "%";
    document.getElementById("resMarkup").textContent = markup.toFixed(2);

    atualizarSemaforo(margemContribuicao, lucroLiquido);

  });

  btnLimpar.addEventListener("click", function () {

    document.querySelectorAll("input").forEach(i => i.value = "");
    document.querySelectorAll(".produto-select").forEach(s => s.value = "");
    document.querySelectorAll(".custo-produto, .valor-venda-produto, .subtotal-produto").forEach(i => i.value = "0,00");
    if (cenarioSelect) cenarioSelect.value = "";
    if (estadoSelect) estadoSelect.value = "";
    if (provisaoGastosFixosInput) provisaoGastosFixosInput.value = "0,00";
    const freteInput = document.getElementById("frete");
    if (freteInput) freteInput.value = "0,00";
    if (valorTotalProdutos) valorTotalProdutos.textContent = fmtBRL(0);

    document.getElementById("statusSemaforo").textContent =
      "- AGUARDANDO CALCULO -";

    document.getElementById("statusSemaforo").style.color = "#000";

    ["resMargemBruta", "resMargemContribuicao", "resLucroLiquido", "resMarkup"]
      .forEach(id => document.getElementById(id).textContent = "-");

  });

  function atualizarSemaforo(margem, lucro) {

    const el = document.getElementById("statusSemaforo");

    let status;
    let cor;

    if (lucro < 0) {
      status = "PREJUIZO OPERACIONAL";
      cor = "#dc3545";
    }
    else if (margem < 10) {
      status = "ABAIXO DA META";
      cor = "#ffc107";
    }
    else {
      status = "SAUDAVEL";
      cor = "#198754";
    }

    el.textContent = status;
    el.style.color = cor;
  }

  atualizarTotalProdutos();

})();
