## Como usar

1. No terminal, vá até a pasta onde salvou o `docker-compose.yml`.
2. Rode:

```bash
docker-compose up -d
```

* Isso vai criar os containers e rodar em segundo plano.
* `postgres` vai ficar na porta **5432**.
* `pgAdmin` vai ficar na porta **8080**.

3. Acesse o pgAdmin pelo navegador:

```
http://localhost:8080
```

* Email: `admin@admin.com`
* Senha: `admin`

4. Crie um servidor dentro do pgAdmin:

* **Host name/address:** `postgres`
* **Port:** `5432`
* **Username:** `admin`
* **Password:** `admin`
* **Database:** `oceanica`

5. Banco de dados dentro do pgAdmin
**oceanica-pescados**

6. Tabelas & índices
<a href="bd.sql">oceanica-bd.sql</a>
