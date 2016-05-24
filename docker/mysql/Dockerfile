FROM mysql:5.7

ENV MYSQL_ROOT_PASSWORD Passw0rd 
ADD ./dump.sql.gz /tmp/.
#ADD ./dump.sql /tmp/. && mysqladmin -uroot -pPassw0rd create testdb && mysql -uroot -pPassw0rd testdb < /tmp/dump.sql
#ADD ./dump.sql /tmp/. && mysqladmin -uroot -pPassw0rd create main && mysql -uroot -pPassw0rd main < /tmp/dump.sql.gz
#ADD ./initdb.sh /docker-entrypoint-initdb.d/.

#RUN /bin/bash -c "/usr/bin/mysqld_safe &" \
#&& sleep 60 && mysqladmin -uroot -pPassw0rd create testdb


