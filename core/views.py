from datetime import date
from decimal import Decimal, InvalidOperation

from django.contrib import messages
from django.db import IntegrityError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render

from .models import Cenario, EstadoAliquota, PedidoProducao, Produto
from .services.ofx_converter import ConversorOFXError, extrair_lancamentos_bradesco, gerar_ofx

ETAPA_PRODUCAO = "60"
UFS_BRASIL = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
    "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]


def parse_decimal_brasileiro(valor):
    valor = (valor or "").strip().replace(".", "").replace(",", ".")
    return Decimal(valor)

def index(request):
    return render(request, "index.html")

def precificacao(request):
    context = {
        "produtos": Produto.objects.all(),
        "estados": EstadoAliquota.objects.all(),
        "cenarios": Cenario.objects.all(),
    }
    return render(request, "precificacao.html", context)

def configuracoes(request):
    cenario_em_edicao = None

    if request.method == "POST":
        acao = request.POST.get("acao", "salvar")
        cenario_id = request.POST.get("cenario_id")

        if acao == "excluir":
            cenario = get_object_or_404(Cenario, pk=cenario_id)
            cenario.delete()
            messages.success(request, "Cenario excluido com sucesso.")
            return redirect("core:configuracoes")

        nome = request.POST.get("nome", "").strip()
        if not nome:
            messages.error(request, "Informe o nome do cenario.")
            return redirect("core:configuracoes")

        campos_percentuais = [
            "pis",
            "cofins",
            "irpj",
            "csll",
            "ipi",
            "comissoes",
            "projetos",
            "construtor",
            "outros_custos_provisoes",
            "provisao_gastos_fixos",
            "margem_lucro_desejada",
            "total_custos_provisoes",
        ]

        try:
            valores = {
                campo: parse_decimal_brasileiro(request.POST.get(campo, "0,00") or "0,00")
                for campo in campos_percentuais
            }
        except (InvalidOperation, ValueError):
            messages.error(request, "Informe percentuais validos.")
            return redirect("core:configuracoes")

        valores["total_custos_provisoes"] = sum(
            valores[campo]
            for campo in campos_percentuais
            if campo != "total_custos_provisoes"
        )

        cenario = get_object_or_404(Cenario, pk=cenario_id) if cenario_id else Cenario()
        cenario.nome = nome
        cenario.contribuinte = request.POST.get("contribuinte") == "sim"
        for campo, valor in valores.items():
            setattr(cenario, campo, valor)

        try:
            cenario.save()
        except IntegrityError:
            messages.error(request, "Nao foi possivel salvar. Verifique se o nome do cenario ja existe.")
            return redirect("core:configuracoes")

        messages.success(request, "Cenario salvo com sucesso.")
        return redirect("core:configuracoes")

    editar_id = request.GET.get("editar")
    if editar_id:
        cenario_em_edicao = get_object_or_404(Cenario, pk=editar_id)

    context = {
        "cenarios": Cenario.objects.all(),
        "cenario_em_edicao": cenario_em_edicao,
    }
    return render(request, "cenarios.html", context)

def frete(request):
    return render(request, "frete.html")

def regras(request):
    return render(request, "regras.html")

def produtos(request):
    produto_em_edicao = None

    if request.method == "POST":
        acao = request.POST.get("acao", "salvar")
        produto_id = request.POST.get("produto_id")

        if acao == "excluir":
            produto = get_object_or_404(Produto, pk=produto_id)
            produto.delete()
            messages.success(request, "Produto excluido com sucesso.")
            return redirect("core:produtos")

        codigo = request.POST.get("codigo", "").strip()
        nome = request.POST.get("nome", "").strip()
        custo_raw = request.POST.get("custo", "").strip()
        valor_venda_raw = request.POST.get("valor_venda", "").strip()

        if not codigo or not nome or not custo_raw or not valor_venda_raw:
            messages.error(request, "Preencha todos os campos do produto.")
            return redirect("core:produtos")

        try:
            custo = parse_decimal_brasileiro(custo_raw)
            valor_venda = parse_decimal_brasileiro(valor_venda_raw)
        except (InvalidOperation, ValueError):
            messages.error(request, "Informe valores validos para custo e venda.")
            return redirect("core:produtos")

        produto = get_object_or_404(Produto, pk=produto_id) if produto_id else Produto()
        produto.codigo = codigo
        produto.nome = nome
        produto.custo = custo
        produto.valor_venda = valor_venda

        try:
            produto.save()
        except IntegrityError:
            messages.error(request, "Nao foi possivel salvar. Verifique se o codigo ja existe.")
            return redirect("core:produtos")

        messages.success(request, "Produto salvo com sucesso.")
        return redirect("core:produtos")

    editar_id = request.GET.get("editar")
    if editar_id:
        produto_em_edicao = get_object_or_404(Produto, pk=editar_id)

    context = {
        "produtos": Produto.objects.all(),
        "produto_em_edicao": produto_em_edicao,
    }
    return render(request, "produtos.html", context)

def estados(request):
    if request.method == "POST":
        uf = request.POST.get("uf", "").strip().upper()
        difal_raw = request.POST.get("difal", "").strip()
        icms_raw = request.POST.get("icms", "").strip()

        if uf not in UFS_BRASIL:
            messages.error(request, "Selecione um estado valido.")
            return redirect("core:estados")

        if not icms_raw:
            messages.error(request, "Informe a aliquota de ICMS.")
            return redirect("core:estados")

        if uf != "SP" and not difal_raw:
            messages.error(request, "Informe a aliquota de DIFAL.")
            return redirect("core:estados")

        try:
            icms = parse_decimal_brasileiro(icms_raw)
            difal = None if uf == "SP" else parse_decimal_brasileiro(difal_raw)
        except (InvalidOperation, ValueError):
            messages.error(request, "Informe percentuais validos.")
            return redirect("core:estados")

        EstadoAliquota.objects.update_or_create(
            uf=uf,
            defaults={
                "difal": difal,
                "icms": icms,
            },
        )
        messages.success(request, f"Aliquotas de {uf} salvas com sucesso.")
        return redirect("core:estados")

    configuracoes = {
        estado.uf: {
            "difal": estado.difal_formatado,
            "icms": estado.icms_formatado,
        }
        for estado in EstadoAliquota.objects.all()
    }

    context = {
        "ufs": UFS_BRASIL,
        "configuracoes_estados": configuracoes,
    }
    return render(request, "estados.html", context)


def conversor(request):
    context = {
        "ano_padrao": date.today().year,
        "banco_padrao": "0237",
        "conta_padrao": "CARTAO-BRADESCO",
    }

    if request.method != "POST":
        return render(request, "conversor.html", context)

    arquivo = request.FILES.get("arquivo_html")
    ano = request.POST.get("ano", "").strip()
    banco_id = request.POST.get("banco_id", "0237").strip() or "0237"
    conta_id = request.POST.get("conta_id", "CARTAO-BRADESCO").strip() or "CARTAO-BRADESCO"

    if not arquivo:
        messages.error(request, "Selecione o arquivo HTML da fatura.")
        return render(request, "conversor.html", context)

    if not ano.isdigit() or len(ano) != 4:
        messages.error(request, "Informe o ano dos lancamentos com 4 digitos.")
        return render(request, "conversor.html", context)

    try:
        lancamentos = extrair_lancamentos_bradesco(arquivo.read(), int(ano))
        conteudo_ofx = gerar_ofx(lancamentos, banco_id=banco_id, conta_id=conta_id)
    except (ConversorOFXError, InvalidOperation) as exc:
        messages.error(request, str(exc))
        return render(request, "conversor.html", context)

    nome_download = f"cartao-bradesco-{ano}.ofx"
    response = HttpResponse(conteudo_ofx, content_type="application/x-ofx")
    response["Content-Disposition"] = f'attachment; filename="{nome_download}"'
    return response


#----------------------------------------------------------------------------

def producao(request):
    data_inicial = request.GET.get("data_inicial", "").strip()
    data_final = request.GET.get("data_final", "").strip()

    pedidos = PedidoProducao.objects.filter(etapa=ETAPA_PRODUCAO)

    if data_inicial:
        pedidos = pedidos.filter(data_previsao__gte=data_inicial)

    if data_final:
        pedidos = pedidos.filter(data_previsao__lte=data_final)

    pedidos = pedidos.order_by("-ordem_gerada", "-data_previsao", "-id")

    context = {
        "pedidos": pedidos,
        "data_inicial": data_inicial,
        "data_final": data_final,
    }

    return render(request, "producao.html", context)
