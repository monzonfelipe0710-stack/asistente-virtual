from sources import xml_catalogo
import transform
import output

INPUT = "data/catalogo_tramites.xml"
OUTPUT = "data/tramites_normalizado.json"

def main():
    records = xml_catalogo.read(INPUT)
    data = transform.normalize(records)
    output.write_json(data, OUTPUT)

if __name__ == "__main__":
    main()