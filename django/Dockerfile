# novosti/django

FROM python:3.4
ENV PYTHONUNBUFFERED 1
RUN mkdir /workdir
WORKDIR /workdir

ADD requirements.txt /tmp/
RUN pip install --upgrade pip
RUN pip install -r /tmp/requirements.txt


