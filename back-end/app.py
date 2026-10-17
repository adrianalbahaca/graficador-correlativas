from flask import Flask, jsonify
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173/"])

DB_PATH = "database/mapa.db"

consulta_completa = """
    SELECT
        mat.codigo,
        mat.nombre,
        corr.codigo_correlativa
    FROM materia AS mat
    LEFT JOIN correlativas AS corr
        ON mat.codigo = corr.codigo_materia
    ORDER BY mat.codigo
"""


def obtener_carrera():
    with sqlite3.connect(DB_PATH) as con:
        filas = con.execute(consulta_completa).fetchall()

        # filas es una lista de tuplas que contiene (codigo_materia, nombre_materia, codigo_correlativa)
        # Nota que acá habrá materias repetidas por las correlativas

        # Buscar entre repetidos
        vistos = set()
        materias = []
        for fila in filas:
            if fila[0] not in vistos:
                materias.append(fila)
                vistos.add(fila[0])

        # Luego, crear resultado
        res = []
        for materia in materias:
            corr = [tup[2] for tup in filas if materia[0] == tup[0]]

            if corr[0] is None:
                corr = []

            m = {"codigo": materia[0], "nombre": materia[1], "correlativas": corr}

            res.append(m)

        print(res)

        return res


@app.route("/api/materias/")
def api_materias():
    return jsonify(obtener_carrera())


@app.route("/")
def hola():
    materias = obtener_carrera()

    # TODO: Procesar adecuadamente las materias para usar JSONify y pasarlo a
    # React

    # materias es una lista de diccionarios con las claves "codigo", "nombre", y "correlativas"
    # La última es una lista de códigos de materias correlativas
    # Todas contienen Strings

    return "<p>Por ahora, esto está escrito. Después, debe de reemplazarse con la página</p>"


# TODO: La idea es procesar la base de datos de MATERIAS, cargarla como un objeto de algún tipo
# Luego, lo paso como JSX o como se haga al React
