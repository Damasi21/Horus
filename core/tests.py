from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from .services.ofx_converter import extrair_lancamentos_bradesco, gerar_ofx


class ConversorOFXTests(TestCase):
    html = b"""
    <table>
      <tr class="ico_1line_Tip cursorSimples">
        <td><div class="pl10 tabindex" title='Linha 1.  Data 03/04, Hist\xc3\xb3rico CASHBACK OUTROS, US$0,00, R$9,12'>03/04</div></td>
      </tr>
      <tr class="ico_1line_Tip cursorSimples odd">
        <td><div class="pl10 tabindex" title='Linha 2.  Data 07/04, Hist\xc3\xb3rico AUTO POSTO CASTELINHO, US$0,00, -R$260,06'>07/04</div></td>
      </tr>
      <tr class="ico_1line_Tip cursorSimples">
        <td><div class="pl10 tabindex" title='Linha 3.  Data 08/04, Hist\xc3\xb3rico COMPRA POSITIVA, US$0,00, R$42,50'>08/04</div></td>
      </tr>
    </table>
    """

    def test_extrai_lancamentos_do_html_bradesco(self):
        lancamentos = extrair_lancamentos_bradesco(self.html, 2026)

        self.assertEqual(len(lancamentos), 3)
        self.assertEqual(lancamentos[0].historico, "CASHBACK OUTROS")
        self.assertEqual(str(lancamentos[0].valor), "9.12")
        self.assertEqual(lancamentos[1].historico, "AUTO POSTO CASTELINHO")
        self.assertEqual(str(lancamentos[1].valor), "-260.06")
        self.assertEqual(lancamentos[2].historico, "COMPRA POSITIVA")
        self.assertEqual(str(lancamentos[2].valor), "-42.50")

    def test_gera_ofx_com_credito_e_debito(self):
        lancamentos = extrair_lancamentos_bradesco(self.html, 2026)
        ofx = gerar_ofx(lancamentos)

        self.assertIn("<TRNTYPE>CREDIT", ofx)
        self.assertIn("<TRNAMT>9.12", ofx)
        self.assertIn("<TRNTYPE>DEBIT", ofx)
        self.assertIn("<TRNAMT>-260.06", ofx)
        self.assertIn("<TRNAMT>-42.50", ofx)

    def test_view_devolve_download_ofx(self):
        arquivo = SimpleUploadedFile("fatura.html", self.html, content_type="text/html")
        response = self.client.post(
            reverse("core:conversor"),
            {
                "arquivo_html": arquivo,
                "ano": "2026",
                "banco_id": "0237",
                "conta_id": "CARTAO-TESTE",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/x-ofx")
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertIn(b"<ACCTID>CARTAO-TESTE", response.content)
