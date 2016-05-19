FROM mysql:5.7
ENV MYSQL_USER root
ENV MYSQL_PASSWORD Passw0rd
#RUN mkdir /docker-entrypoint-initdb.d
ADD ./20151117.sql /docker-entrypoint-initdb.d/.
#WORKDIR /backend
#ADD requirements.txt /backend/
#RUN pip install --upgrade pip
#RUN pip install -r requirements.txt
