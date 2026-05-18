from django.contrib import admin

from .models import Cenario, EstadoAliquota, PedidoProducao, Produto


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nome", "custo", "valor_venda")
    search_fields = ("codigo", "nome")


admin.site.register(PedidoProducao)


@admin.register(EstadoAliquota)
class EstadoAliquotaAdmin(admin.ModelAdmin):
    list_display = ("uf", "difal", "icms")
    search_fields = ("uf",)


@admin.register(Cenario)
class CenarioAdmin(admin.ModelAdmin):
    list_display = ("nome", "contribuinte", "pis", "cofins", "ipi", "total_custos_provisoes")
    search_fields = ("nome",)
