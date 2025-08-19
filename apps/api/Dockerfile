FROM node:18

WORKDIR /usr/src/app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm install --production

# Copia o restante do projeto
COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]

