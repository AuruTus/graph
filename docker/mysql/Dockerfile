FROM mysql:5.7

ENV MYSQL_ROOT_PASSWORD Passw0rd 
ADD ./dump.sql /tmp/.
#ADD ./dump.sql /tmp/. && mysqladmin -uroot -pPassw0rd create testdb && ql -uroot -pPassw0rd testdb < /tmp/dump.sql
#ADD ./initdb.sh /docker-entrypoint-initdb.d/.

#RUN /bin/bash -c "/usr/bin/mysqld_safe &" \
#&& sleep 60 && mysqladmin -uroot -pPassw0rd create testdb


