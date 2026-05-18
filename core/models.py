from django.db import models


class Produto(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    nome = models.CharField(max_length=200)
    custo = models.DecimalField(max_digits=12, decimal_places=2)
    valor_venda = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["codigo", "nome"]

    @property
    def custo_formatado(self):
        return f"{self.custo:.2f}".replace(".", ",")

    @property
    def valor_venda_formatado(self):
        return f"{self.valor_venda:.2f}".replace(".", ",")

    def __str__(self):
        return f"{self.codigo} - {self.nome}"


class EstadoAliquota(models.Model):
    uf = models.CharField(max_length=2, unique=True)
    difal = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    icms = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        ordering = ["uf"]

    @property
    def difal_formatado(self):
        if self.difal is None:
            return ""
        return f"{self.difal:.2f}".replace(".", ",")

    @property
    def icms_formatado(self):
        return f"{self.icms:.2f}".replace(".", ",")

    def __str__(self):
        return self.uf


class Cenario(models.Model):
    nome = models.CharField(max_length=200, unique=True)
    contribuinte = models.BooleanField(default=False)
    pis = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cofins = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    irpj = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    csll = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    ipi = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    comissoes = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    projetos = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    construtor = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    outros_custos_provisoes = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    provisao_gastos_fixos = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    margem_lucro_desejada = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_custos_provisoes = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        ordering = ["nome"]

    @staticmethod
    def formatar_percentual(valor):
        return f"{valor:.2f}".replace(".", ",")

    @property
    def pis_formatado(self):
        return self.formatar_percentual(self.pis)

    @property
    def contribuinte_formatado(self):
        return "Sim" if self.contribuinte else "Nao"

    @property
    def cofins_formatado(self):
        return self.formatar_percentual(self.cofins)

    @property
    def irpj_formatado(self):
        return self.formatar_percentual(self.irpj)

    @property
    def csll_formatado(self):
        return self.formatar_percentual(self.csll)

    @property
    def ipi_formatado(self):
        return self.formatar_percentual(self.ipi)

    @property
    def comissoes_formatado(self):
        return self.formatar_percentual(self.comissoes)

    @property
    def projetos_formatado(self):
        return self.formatar_percentual(self.projetos)

    @property
    def construtor_formatado(self):
        return self.formatar_percentual(self.construtor)

    @property
    def outros_custos_provisoes_formatado(self):
        return self.formatar_percentual(self.outros_custos_provisoes)

    @property
    def provisao_gastos_fixos_formatado(self):
        return self.formatar_percentual(self.provisao_gastos_fixos)

    @property
    def margem_lucro_desejada_formatado(self):
        return self.formatar_percentual(self.margem_lucro_desejada)

    @property
    def total_custos_provisoes_formatado(self):
        return self.formatar_percentual(self.total_custos_provisoes)

    def __str__(self):
        return self.nome


class PedidoProducao(models.Model):
    numero_pedido = models.CharField(max_length=50, unique=True)
    codigo_omie = models.CharField(max_length=50, blank=True, null=True)
    cliente = models.CharField(max_length=200, blank=True, null=True)

    data_pedido = models.DateField(blank=True, null=True)
    data_previsao = models.DateField(blank=True, null=True)

    etapa = models.CharField(max_length=10, default="60")
    volume_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    ordem_gerada = models.BooleanField(default=False)
    data_ordem_expedicao = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.numero_pedido} - {self.cliente}"


class ItemPedidoProducao(models.Model):
    pedido = models.ForeignKey(
        PedidoProducao,
        on_delete=models.CASCADE,
        related_name="itens"
    )
    codigo_produto = models.CharField(max_length=50, blank=True, null=True)
    descricao = models.CharField(max_length=255)
    quantidade = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unidade = models.CharField(max_length=20, blank=True, null=True)
    volume = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return self.descricao
