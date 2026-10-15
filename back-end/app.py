from flask import Flask

app = Flask(__name__)


@app.route("/")
def hola():
    return "<p>Hola Mundo </p>"


# TODO: La idea es procesar la base de datos de MATERIAS, cargarla como un objeto de algún tipo
# Luego, lo paso como JSX o como se haga al React
