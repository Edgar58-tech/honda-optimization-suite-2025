-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "nombre_completo" TEXT,
    "puesto" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompanyData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreEmpresa" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "marca" TEXT NOT NULL DEFAULT 'Honda',
    "rfc" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "colonia" TEXT NOT NULL,
    "delegacion" TEXT NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "tieneFinancieraMarca" BOOLEAN NOT NULL DEFAULT false,
    "puedeUsarOtrasFinancieras" BOOLEAN NOT NULL DEFAULT true,
    "nombreFinancieraMarca" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OptimizationHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "parameters" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OptimizationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financiera_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financiera" TEXT NOT NULL,
    "configData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "plan_financiera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financiera" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lineas" TEXT,
    "versiones" TEXT,
    "excepcion1_linea" TEXT,
    "excepcion1_version" TEXT,
    "excepcion2_linea" TEXT,
    "excepcion2_version" TEXT,
    "excepcion3_linea" TEXT,
    "excepcion3_version" TEXT,
    "tasa" REAL NOT NULL,
    "plazo" INTEGER NOT NULL,
    "enganche_minimo" REAL NOT NULL,
    "comision_apertura" REAL NOT NULL,
    "pago_distribuidor" REAL NOT NULL,
    "bono_subsidio" REAL NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "prioridad" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "financiera_config_financiera_key" ON "financiera_config"("financiera");
