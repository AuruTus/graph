# -*- coding: utf-8 -*-


# Для тестовых целей: создание проекции данных с ограниченным числом узлов
def json_semantic(request):
    G = nx.Graph() # Cоздаём пустой NetworkX-граф

    # Создаём объект типа cusros, который позволяет нам подключиться и работаться с базой данных,
    # содержащей данные многомерной матрицы
    cursor = connections['mysql'].cursor()

    offset = 0 # Начало первой возвращаемой строки
    rows = 100 # Максимальное количество возвращаемых строк

    # Формируем sql-запрос к таблице elements, содержащей информационные объекты (далее ИО).
    # Данные объекты, не имеющих связей - ent_or_rel=0 -  являются вершинами нашего графа
    sql = "SELECT el.id, el.data  FROM elements as el WHERE el.ent_or_rel=0 LIMIT "+str(offset)+","+str(rows)

    cursor.execute(sql) # Выполняем sql-запрос
    nodes = cursor.fetchall() # Получаем массив значений результата sql-запроса

    # В цикле проходимся по каждой строке результата запроса
    # и добавляем в граф узлы
    for node in nodes:

        # Вызываем функцию, добавляющую узел в граф, где:
        # node[0] - id узла;
        # G - граф;
        # node[1] - не обязательное поле data, которое мы используем в качестве одного из атрибутов узла;
        add_node_from_db(node[0], G, node[1])

        # Далее для этого узла ищем дуги и добавляем их в граф:
        # формируем sql-запрос к таблице relations, описывающей связи между ИО,
        # и таблице elements, откуда мы получаем поле data для текстового обозначения связи.
        # Эти связи являются дугами нашего графа.
        sql = "SELECT rel.id, rel.arg1, rel.arg2, el.data FROM relations as rel, elements as el WHERE rel.id = el.id AND (rel.arg1="+str(node[0])+" OR rel.arg2="+str(node[0])+")"

        cursor.execute(sql) # Выполняем sql-запрос
        edges = cursor.fetchall() # Получаем массив значений результата sql-запроса

        # Проходимся в цикле по всем строкам результата sql-запроса и добавляем в граф дуги.
        for edge in edges:

            # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
            edgeAttributes = get_edge_attributes(edge[0])

            # Добавляем в граф дугу с атрибутами id и data,
            # а также, с полученным отдельно словарем атрибутов - attributes
            # Возможна ситуация, когда один из узлов дуги ещё не добавлен в граф,
            # В этом случае, при выполнении функции add_edge() узел будет добавлен автоматически, 
            # но без необходимых аттрибутов: это исправляется вызовом функции add_node_from_db().
            G.add_edge(edge[1], edge[2], id=edge[0], data=edge[3], attributes=edgeAttributes)
            add_node_from_db(int(edge[1]), G) # Добавляем к первому узлу дуги необходимые аттрибуты
            add_node_from_db(int(edge[2]), G) # Добавляем ко второму узлу дуги необходимые аттрибуты

    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    graphData = json_graph.node_link_data(G)

    # Преобразуем данные в json-формат
    result = json.dumps(graphData, sort_keys=True, indent=4, separators=(',', ': '))

    response = HttpResponse() # Создаём объект response для динамического создания html-страницы
    response['Content-Type'] = "text/javascript; charset=utf-8" # Объявляем основные мета-данные html-страницы
    response.write(result) # Записываем в объкт response полученную структуру графа в json-формате

    # возвращаем все необходимые фреймворку Django данные для окончательной генерации html-страницы
    return response 


# Для тестовых целей:
# Создание графа - многомерной проекции "семантической кучи" - первым методом
def create_graph_method_01():
    G = nx.Graph() # Cоздаём пустой NetworkX-граф

    # Создаём объект типа cusros, который позволяет нам подключиться и работаться с базой данных,
    # содержащей данные многомерной матрицы
    cursor = connections['mysql'].cursor()

    # Формируем sql-запрос к таблице elements, содержащей информационные объекты (далее ИО).
    # Данные объекты, не имеющих связей - ent_or_rel=0 -  являются вершинами нашего графа
    sql = "SELECT el.id, el.data  FROM elements as el WHERE el.ent_or_rel=0"

    cursor.execute(sql) # Выполняем sql-запрос
    nodes = cursor.fetchall() # Получаем массив значений результата sql-запроса

    # В цикле проходимся по каждой строке результата запроса
    # и добавляем в граф узлы
    for node in nodes:

        # Вызываем функцию, добавляющую узел в граф, где:
        # node[0] - id узла;
        # G - граф;
        # node[1] - не обязательное поле data, которое мы используем в качестве одного из атрибутов узла;
        add_node_from_db(node[0], G, node[1])

        # Далее для этого узла ищем дуги и добавляем их в граф:
        # формируем sql-запрос к таблице relations, описывающей связи между ИО,
        # и таблице elements, откуда мы получаем поле data для текстового обозначения связи.
        # Эти связи являются дугами нашего графа.
        sql = "SELECT rel.id, rel.arg1, rel.arg2, el.data FROM relations as rel, elements as el WHERE rel.id = el.id AND (rel.arg1="+str(node[0])+" OR rel.arg2="+str(node[0])+")"

        cursor.execute(sql) # Выполняем sql-запрос
        edges = cursor.fetchall() # Получаем массив значений результата sql-запроса

        # Проходимся в цикле по всем строкам результата sql-запроса и добавляем в граф дуги.
        for edge in edges:

            # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
            edgeAttributes = get_edge_attributes_from_db(edge[0])

            # Добавляем в граф дугу с атрибутами id и data,
            # а также, с полученным отдельно словарем атрибутов - attributes
            # Возможна ситуация, когда один из узлов дуги ещё не добавлен в граф,
            # В этом случае, при выполнении функции add_edge() узел будет добавлен автоматически, 
            # но без необходимых аттрибутов: это исправляется вызовом функции add_node_from_db().
            G.add_edge(edge[1], edge[2], id=edge[0], data=edge[3], attributes=edgeAttributes)
            add_node_from_db(int(edge[1]), G) # Добавляем к первому узлу дуги необходимые аттрибуты
            add_node_from_db(int(edge[2]), G) # Добавляем ко второму узлу дуги необходимые аттрибуты

    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    data = json_graph.node_link_data(G)

    # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    graph = Graph() 

    graph.title = "Semantic" # Определяем заголовок графа
    graph.body = json.dumps(data) # Преобразуем данные в json-формат
    graph.save() # Сохраняем граф в собственную базу данных

    return True


# Для тестовых целей:
# Создание графа - многомерной проекции "семантической кучи" - вторым методом
def create_graph_method_02():
    # Cоздаём пустой NetworkX-граф
    G = nx.Graph()

    # Устанавливаем соединение с БД, в которой хранятся семантически связанные данные
    cursor = connections['mysql'].cursor()

    sql = "SELECT rel.id, rel.arg1, rel.arg2, el.data FROM relations as rel, elements as el WHERE rel.id = el.id"

    cursor.execute(sql) # Выполняем sql-запрос
    edges = cursor.fetchall() # Получаем массив значений результата sql-запроса

    # Проходимся в цикле по всем строкам результата sql-запроса и добавляем в граф дуги.
    for edge in edges:

        # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
        edgeAttributes = get_edge_attributes_from_db(edge[0])

        G.add_edge(edge[1], edge[2], id=edge[0], data=edge[3], attributes=edgeAttributes)
        add_node_from_db(int(edge[1]), G)
        add_node_from_db(int(edge[2]), G)

    # Средствами бибилиотеки NetworkX,
    # экспортируем граф в виде подходящeм для json-сериализации
    data = json_graph.node_link_data(G)

    # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    graph = Graph() 

    # Определяем заголовок графа
    graph.title = "Многомерная проекция 'семантической кучи' по заданному фильтру" 

    # Преобразуем данные в json-формат
    graph.body = json.dumps(data) 

    # Сохраняем граф в собственную базу данных
    graph.save() 

    return True


