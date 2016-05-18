FROM python:3.4
ENV PYTHONUNBUFFERED 1
RUN mkdir /backend
WORKDIR /backend
ADD requirements.txt /backend/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
ADD . /backend/
