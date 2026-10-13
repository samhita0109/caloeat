# Contributing to CaloEat 🥗

Thank you for contributing to **CaloEat**!

## Collaboration Workflow

1. **Fork or Branch**: Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Coding Standards**:
   - Ensure all TypeScript types are strictly maintained without `any`.
   - Keep components modular under `src/components/` and screens in `src/screens/`.
   - Update metabolic formulas or nutrition data in `src/utils/metabolic.ts` and `src/data/foodDatabase.ts`.
3. **Run Validation**:
   ```bash
   npm run typecheck
   npm test
   ```
4. **Submit a Pull Request**:
   - Push your branch and open a Pull Request against `main`.
   - Provide a clear description of changes made and any test results.
