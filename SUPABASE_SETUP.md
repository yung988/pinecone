# Supabase Setup pro Chat Historie

## 1. Vytvořte Supabase projekt

1. Jděte na [supabase.com](https://supabase.com)
2. Vytvořte nový projekt
3. Počkejte, než se databáze inicializuje

## 2. Spusťte SQL migraci

1. V Supabase dashboardu jděte do sekce "SQL Editor"
2. Otevřete `supabase-migration.sql` ze složky projektu
3. Zkopírujte celý obsah souboru
4. Vložte do SQL Editoru a spusťte (klikněte na "Run")

## 3. Nastavte environment variables

1. V Supabase dashboardu jděte do "Settings" > "API"
2. Zkopírujte:
   - Project URL (pro `NEXT_PUBLIC_SUPABASE_URL`)
   - Anon key (pro `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Aktualizujte váš `.env` soubor:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Testování

Po nastavení restartujte development server:

```bash
pnpm dev
```

Chat historie by se teď měla ukládat do Supabase databáze!

## Funkce

- ✅ Automatické ukládání každé konverzace
- ✅ Historie přes všechny zařízení (s stejným browser fingerprint)
- ✅ Export/Import historie do JSON
- ✅ Smazání jednotlivých konverzací
- ✅ Automatické generování titulků z první zprávy

## Bezpečnost

Aktuálně je nastavena jednoduchá politika, která umožňuje přístup všem. Pro produkci doporučujeme:

1. Implementovat skutečnou autentifikaci
2. Upravit RLS politiky v Supabase
3. Přidat rate limiting

