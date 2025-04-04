import discord
import random
from discord.ext import commands
import os

# Configuração do bot
TOKEN = os.getenv("TOKEN")
intents = discord.Intents.default()  # Habilita as intents padrão
intents.message_content = True  # Habilita a Message Content Intent
bot = commands.Bot(command_prefix="!", intents=intents)

# Dicionário com cidades por país
cidades = {
    "Formação Morrison": ["Torvosaurus t.", "Brachiosaurus", "Dryosaurus", "Camarasaurus", "Apatosaurus"],
    "Formação Huincul": ["Argentinossauro Huinculensis"],
    "Formação Kayenta": ["Dilofossauro"]
}

class MenuSelecao(discord.ui.View):
    def __init__(self):
        super().__init__()

    @discord.ui.select(
        placeholder="Escolha um sítio",
        options=[
            discord.SelectOption(label="Formação Morrison"),
            discord.SelectOption(label="Formação Huincul"),
            discord.SelectOption(label="Formação Kayenta")
        ]
    )
    async def select_callback(self, interaction: discord.Interaction, select: discord.ui.Select):
        pais_escolhido = select.values[0]
        numero_sorteado = random.randint(0, 5)
        cidade_sorteada = random.choice(cidades[pais_escolhido])

        if numero_sorteado == 0:
            mensagem = "Infelizmente, você não conseguiu escavar nenhum fóssil dessa vez."
        else:
            mensagem = f"Você escavou **{numero_sorteado}** fósseis de **{cidade_sorteada}**"

        embed = discord.Embed(
            title="",
            description=f"Sítio Paleontológico: {pais_escolhido}\n{mensagem}",
            color=discord.Color.red() if numero_sorteado == 0 else discord.Color(0xbbc167)
        )

        # Edita a mensagem original, remove a view
        await interaction.response.edit_message(embed=embed, view=None)

@bot.command(name="fossil")
async def sorteio(ctx):
    view = MenuSelecao()
    # Envia a mensagem inicial com a view
    msg = await ctx.send("**TESTE GLOBAL:**", view=view)
    # Armazena a mensagem no contexto para edição futura, se necessário.

if __name__ == "__main__":
    bot.run(TOKEN)
