import hashlib
import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from html import escape
from html.parser import HTMLParser


class ConversorOFXError(ValueError):
    pass


@dataclass(frozen=True)
class LancamentoCartao:
    linha: int
    data: datetime
    historico: str
    valor: Decimal


class BradescoCartaoHTMLParser(HTMLParser):
    def __init__(self, ano):
        super().__init__(convert_charrefs=True)
        self.ano = ano
        self._em_linha_lancamento = False
        self.lancamentos = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == "tr":
            classes = attrs_dict.get("class", "")
            self._em_linha_lancamento = all(
                classe in classes.split()
                for classe in ("ico_1line_Tip", "cursorSimples")
            )
            return

        if not self._em_linha_lancamento or tag != "div":
            return

        titulo = attrs_dict.get("title", "")
        if "Linha" not in titulo or "Data" not in titulo or "R$" not in titulo:
            return

        lancamento = parse_titulo_lancamento(titulo, self.ano)
        if lancamento:
            self.lancamentos.append(lancamento)

    def handle_endtag(self, tag):
        if tag == "tr":
            self._em_linha_lancamento = False


def decodificar_html(conteudo):
    for encoding in ("utf-8", "cp1252", "iso-8859-1"):
        try:
            return conteudo.decode(encoding)
        except UnicodeDecodeError:
            continue
    return conteudo.decode("utf-8", errors="replace")


def parse_valor_brasileiro(valor):
    valor = valor.replace("R$", "").replace(" ", "").strip()
    sinal = -1 if valor.startswith("-") else 1
    valor = valor.replace("-", "").replace(".", "").replace(",", ".")
    return Decimal(valor) * sinal


def parse_titulo_lancamento(titulo, ano):
    padrao = re.compile(
        r"Linha\s+(\d+)\.\s*Data\s+(\d{2})/(\d{2}),\s*Hist.rico\s+(.*?),\s*US\$[\d.,-]+,\s*(-?R\$\s*[\d.,]+)",
        re.IGNORECASE,
    )
    match = padrao.search(" ".join(titulo.split()))
    if not match:
        return None

    linha, dia, mes, historico, valor = match.groups()

    try:
        data = datetime(int(ano), int(mes), int(dia), 10, 0, 0)
    except ValueError as exc:
        raise ConversorOFXError(f"Data invalida na linha {linha}: {dia}/{mes}/{ano}.") from exc

    historico = " ".join(historico.split())
    valor = parse_valor_brasileiro(valor)
    if historico.upper() != "CASHBACK OUTROS":
        valor = -abs(valor)

    return LancamentoCartao(
        linha=int(linha),
        data=data,
        historico=historico,
        valor=valor,
    )


def extrair_lancamentos_bradesco(conteudo_html, ano):
    parser = BradescoCartaoHTMLParser(ano)
    parser.feed(decodificar_html(conteudo_html))

    if not parser.lancamentos:
        raise ConversorOFXError(
            "Nenhum lancamento foi encontrado. Verifique se o HTML e a fatura detalhada do cartao Bradesco."
        )

    return sorted(parser.lancamentos, key=lambda lancamento: (lancamento.data, lancamento.linha))


def formatar_data_ofx(data):
    return data.strftime("%Y%m%d%H%M%S") + "[-03:EST]"


def formatar_valor_ofx(valor):
    return f"{valor:.2f}"


def gerar_fitid(lancamento, indice):
    base = f"{lancamento.data:%Y%m%d}|{lancamento.linha}|{lancamento.historico}|{lancamento.valor}|{indice}"
    sufixo = hashlib.sha1(base.encode("utf-8")).hexdigest()[:8].upper()
    return f"{lancamento.data:%Y%m%d}{indice:03d}{sufixo}"


def gerar_ofx(lancamentos, banco_id="0237", conta_id="CARTAO-BRADESCO"):
    agora = datetime.now()
    data_inicio = min(lancamento.data for lancamento in lancamentos)
    data_fim = max(lancamento.data for lancamento in lancamentos)

    linhas = [
        "OFXHEADER:100",
        "DATA:OFXSGML",
        "VERSION:102",
        "SECURITY:NONE",
        "ENCODING:USASCII",
        "CHARSET:1252",
        "COMPRESSION:NONE",
        "OLDFILEUID:NONE",
        "NEWFILEUID:NONE",
        "",
        "<OFX>",
        "<SIGNONMSGSRSV1>",
        "<SONRS>",
        "<STATUS>",
        "<CODE>0",
        "<SEVERITY>INFO",
        "</STATUS>",
        f"<DTSERVER>{formatar_data_ofx(agora)}",
        "<LANGUAGE>POR",
        "</SONRS>",
        "</SIGNONMSGSRSV1>",
        "<BANKMSGSRSV1>",
        "<STMTTRNRS>",
        "<TRNUID>1001",
        "<STATUS>",
        "<CODE>0",
        "<SEVERITY>INFO",
        "</STATUS>",
        "<STMTRS>",
        "<CURDEF>BRL",
        "<BANKACCTFROM>",
        f"<BANKID>{escape(banco_id)}",
        f"<ACCTID>{escape(conta_id)}",
        "<ACCTTYPE>CHECKING",
        "</BANKACCTFROM>",
        "<BANKTRANLIST>",
        f"<DTSTART>{formatar_data_ofx(data_inicio)}",
        f"<DTEND>{formatar_data_ofx(data_fim)}",
        "",
    ]

    for indice, lancamento in enumerate(lancamentos, start=1):
        fitid = gerar_fitid(lancamento, indice)
        linhas.extend(
            [
                "<STMTTRN>",
                f"<TRNTYPE>{'CREDIT' if lancamento.valor >= 0 else 'DEBIT'}",
                f"<DTPOSTED>{formatar_data_ofx(lancamento.data)}",
                f"<TRNAMT>{formatar_valor_ofx(lancamento.valor)}",
                f"<FITID>{fitid}",
                f"<CHECKNUM>{fitid}",
                f"<MEMO>{escape(lancamento.historico)}",
                "</STMTTRN>",
            ]
        )

    linhas.extend(
        [
            "</BANKTRANLIST>",
            "</STMTRS>",
            "</STMTTRNRS>",
            "</BANKMSGSRSV1>",
            "</OFX>",
            "",
        ]
    )
    return "\n".join(linhas)
