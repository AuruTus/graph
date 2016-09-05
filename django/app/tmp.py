# Отладочная информация при получении json-данных графа
    """
    H = json.loads(graph.body)
    G = json_graph.node_link_graph(H)
    response.write('\n\n\n')
    response.write(graph.body)
    """

# Симуляция обработки должности 
"""
sql = "SELECT DISTINCT el.data FROM element as el, elementclasses as ec \
    WHERE el.id=ec.element_id AND ec.class_id=2"
self.cursor.execute(sql)
self.positions = self.cursor.fetchall()
"""
# /Симуляция обработки должности 


# Запрос для создания максимально возможного графа
sql = "SELECT el.id FROM element as el WHERE el.is_entity=1"


# Преобразуем в объект json-массив параметров, полученных из url 
try: 
    gfilter = json.loads(gfilter)
    #print_json(gfilter)
except:
    render_content('Ошибка при обработке json-массива gfilter')
    raise

# Обрабатываем массив filterOptions
try:
    filterOptions = gfilter['filterOptions']
    # Производим фильтрацию полученного графа по выбранным в фильтре опциям
    G = GFilterZero(G, filterOptions['removeZero'])
except:
    render_content('Ошибка при обработке json-массива filterOptions')
    raise

# Обрабатываем массив filterAttributes
try:
    filterAttributes = gfilter['filterAttributes']
    #print_json(filterAttributes)
    #G = GFilterAttributes(G, filterAttributes)
except:
    render_content('Ошибка при обработке json-массива filterAttributes')
    raise

# Обрабатываем массив filterTaxonomy
try:
    filterTaxonomy = gfilter['filterTaxonomy']
    #print_json(filterTaxonomy)
    #  Производим фильтрацию по выбранным типам ИО
    G = GFilterTaxonomy(G, filterTaxonomy)
except:
    render_content('Ошибка при обработке json-массива filterTaxonomy')
    raise

