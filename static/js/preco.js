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
  const linhasSimulacaoMarkup = document.getElementById("linhasSimulacaoMarkup");
  const passoMarkupSelect = document.getElementById("passoMarkupSelect");
  let ultimaSimulacaoMarkup = null;

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

  function fmtPercentual(n) {
    return n.toFixed(1).replace(".", ",") + "%";
  }

  function criarCelula(texto) {
    const td = document.createElement("td");
    td.textContent = texto;
    return td;
  }

  function limparSimulacaoMarkup() {
    if (!linhasSimulacaoMarkup) return;

    linhasSimulacaoMarkup.innerHTML = "";
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 7;
    celula.className = "text-muted py-3";
    celula.textContent = "- AGUARDANDO CALCULO -";
    linha.appendChild(celula);
    linhasSimulacaoMarkup.appendChild(linha);
  }

  function adicionarLinhaSimulacao(dados) {
    if (!linhasSimulacaoMarkup) return;

    const linha = document.createElement("tr");

    if (dados.lucroLiquidoPercentual < 0) {
      linha.classList.add("linha-prejuizo");
    } else if (dados.lucroLiquidoPercentual < 10) {
      linha.classList.add("linha-equilibrio");
    }

    [
      dados.markup.toFixed(3).replace(".", ","),
      fmtBRL(dados.precoVenda),
      fmtPercentual(dados.margemBruta),
      fmtPercentual(dados.margemContribuicao),
      fmtBRL(dados.margemContribuicaoValor),
      fmtPercentual(dados.lucroLiquidoPercentual),
      fmtBRL(dados.lucroLiquidoValor)
    ].forEach(valor => linha.appendChild(criarCelula(valor)));

    linhasSimulacaoMarkup.appendChild(linha);
  }

  function calcularMargemBruta(valorBrutoVendas, totalCustosProvisoes, provisaoGastosFixos) {
    const custosSemProvisaoFixa = Math.max(totalCustosProvisoes - provisaoGastosFixos, 0);
    const receitaLiquida = valorBrutoVendas / (1 + (custosSemProvisaoFixa / 100));

    return receitaLiquida > 0
      ? (valorBrutoVendas / receitaLiquida) * 100
      : 0;
  }

  function atualizarSimulacaoMarkup(custoProduto, totalCustosProvisoes, provisaoGastosFixos) {
    if (!linhasSimulacaoMarkup) return;

    linhasSimulacaoMarkup.innerHTML = "";
    ultimaSimulacaoMarkup = { custoProduto, totalCustosProvisoes, provisaoGastosFixos };

    if (custoProduto <= 0 || totalCustosProvisoes >= 100) {
      limparSimulacaoMarkup();
      return;
    }

    const markupContribuicaoZero = 100 / (100 - totalCustosProvisoes);
    const passoMarkup = Number(passoMarkupSelect?.value || 0.2);
    const markups = Array.from({ length: 6 }, (_, index) => markupContribuicaoZero + (passoMarkup * index));

    markups.forEach(markup => {
      const precoVenda = custoProduto * markup;
      const margemBruta = calcularMargemBruta(precoVenda, totalCustosProvisoes, provisaoGastosFixos);
      const margemContribuicao = margemBruta - totalCustosProvisoes;
      const lucroLiquidoPercentual = margemContribuicao - provisaoGastosFixos;

      adicionarLinhaSimulacao({
        markup,
        precoVenda,
        margemBruta,
        margemContribuicao,
        margemContribuicaoValor: precoVenda * (margemContribuicao / 100),
        lucroLiquidoPercentual,
        lucroLiquidoValor: precoVenda * (lucroLiquidoPercentual / 100)
      });
    });
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

  passoMarkupSelect?.addEventListener("change", function () {
    if (!ultimaSimulacaoMarkup) return;

    atualizarSimulacaoMarkup(
      ultimaSimulacaoMarkup.custoProduto,
      ultimaSimulacaoMarkup.totalCustosProvisoes,
      ultimaSimulacaoMarkup.provisaoGastosFixos
    );
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

    const margemBruta = calcularMargemBruta(precoVenda, totalCustosProvisoes, provisaoGastosFixos);

    const margemContribuicao = margemBruta - totalCustosProvisoes;
    const lucroLiquido = margemContribuicao - provisaoGastosFixos;

    atualizarSimulacaoMarkup(custoProduto, totalCustosProvisoes, provisaoGastosFixos);
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

    limparSimulacaoMarkup();

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
  limparSimulacaoMarkup();

})();
