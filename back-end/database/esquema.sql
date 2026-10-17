CREATE TABLE materia(
  codigo TEXT PRIMARY KEY,
  nombre TEXT NOT NULL
) STRICT;

CREATE TABLE correlativas(
  codigo_materia TEXT NOT NULL,
  codigo_correlativa TEXT NOT NULL,
  PRIMARY KEY(codigo_materia, codigo_correlativa),
  FOREIGN KEY(codigo_materia) REFERENCES materia(codigo) 
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY(codigo_correlativa) REFERENCES materia(codigo) 
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CHECK (codigo_materia <> codigo_correlativa)
) STRICT;
