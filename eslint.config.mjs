import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Scripts utilitários avulsos (ex.: processar imagem uma vez via CLI),
      // não fazem parte do app — CommonJS aqui é o formato certo, não um
      // erro do TypeScript/no-require-imports.
      "scripts/**",
    ],
  },
  {
    rules: {
      // Convenção do projeto: prefixo `_` marca uma variável desestruturada
      // só pra excluir do resto do objeto (ex.: `const { senha: _senha,
      // ...seguro } = bruto`), não uma variável esquecida de verdade.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
