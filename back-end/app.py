from flask import Flask
import sqlite3

app = Flask(__name__)

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
        # TODO: Algoritmo para limpiar todo y dejar el elemento como debe ser
        # Sugiero una lista de diccionarios, donde contenga el nombre, codigo y una lista de los codigos de las correlativas
        
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

            m = {
                "codigo": materia[0],
                "nombre": materia[1],
                "correlativas": corr
            }

            res.append(m)  # Esto después lo reviso

        print(res)

        return res

@app.route("/")
def hola():
    materias = obtener_carrera()

    return "<p>Hola Mundo </p>"


# TODO: La idea es procesar la base de datos de MATERIAS, cargarla como un objeto de algún tipo
# Luego, lo paso como JSX o como se haga al React
