from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path("", views.index, name="index"),
    path("precificacao/", views.precificacao, name="precificacao"),
    path("configuracoes/", views.configuracoes, name="configuracoes"),
    path("regras/", views.regras, name="regras"),
    path("produtos/", views.produtos, name="produtos"),
    path("estados/", views.estados, name="estados"),
    path("conversor/", views.conversor, name="conversor"),
    path("frete/", views.frete, name="frete"),
    path("producao/", views.producao, name="producao"),
]
