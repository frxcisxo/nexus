/**
 * IMPACT CALCULATOR
 * Construye grafo de dependencias y calcula impacto en cascada
 * Determina qué se ve afectado por cada cambio
 */
import { promises as fs } from 'fs';
import { join } from 'path';
export class ImpactCalculator {
    constructor(repoPath) {
        this.repoPath = repoPath;
        this.graph = {
            nodes: new Map(),
            edges: new Map(),
        };
    }
    /**
     * Construye el grafo de dependencias analizando imports/requires
     * Soporta TypeScript, JavaScript, Python, Java
     */
    async buildDependencyGraph() {
        const files = await this.findSourceFiles();
        for (const file of files) {
            const content = await fs.readFile(join(this.repoPath, file), 'utf-8');
            const imports = this.extractImports(content, file);
            const exports = this.extractExports(content, file);
            // Crear nodo para este archivo
            if (!this.graph.nodes.has(file)) {
                this.graph.nodes.set(file, {
                    name: file,
                    type: 'internal',
                    consumers: [],
                });
            }
            // Agregar edges (dependencias)
            if (!this.graph.edges.has(file)) {
                this.graph.edges.set(file, []);
            }
            for (const imp of imports) {
                this.graph.edges.get(file).push(imp);
            }
        }
        // Calcular consumidores (reverse edges)
        for (const [file, deps] of this.graph.edges) {
            for (const dep of deps) {
                const node = this.graph.nodes.get(dep);
                if (node) {
                    node.consumers.push(file);
                }
            }
        }
    }
    /**
     * Calcula el impacto completo de un conjunto de cambios
     * Incluye: affected files, risk score, work estimation
     */
    async calculateImpact(changes) {
        const directlyAffected = new Set();
        const indirectlyAffected = new Set();
        const cascadeChain = {};
        let totalRisk = 0;
        let breakingCount = 0;
        // Procesar cada cambio
        for (const change of changes) {
            const affected = await this.findAffectedFiles(change.file);
            const cascade = await this.calculateCascade(change.file);
            affected.directly.forEach(f => directlyAffected.add(f));
            affected.indirectly.forEach(f => indirectlyAffected.add(f));
            cascadeChain[change.file] = cascade;
            totalRisk += this.calculateRisk(change);
            if (change.breakingChange)
                breakingCount++;
        }
        const avgRisk = changes.length > 0 ? totalRisk / changes.length : 0;
        const hasBreaking = breakingCount > 0;
        return {
            changes,
            directlyAffected: Array.from(directlyAffected),
            indirectlyAffected: Array.from(indirectlyAffected),
            consumers: this.categorizeConsumers(Array.from(directlyAffected), Array.from(indirectlyAffected)),
            breakingChanges: hasBreaking,
            riskScore: Math.min(avgRisk, 1),
            cascadeChain,
            estimatedWorkDays: this.estimateWorkload(directlyAffected.size + indirectlyAffected.size, hasBreaking),
            affectedTypes: await this.findAffectedTypes(changes),
            affectedFunctions: await this.findAffectedFunctions(changes),
        };
    }
    /**
     * Encuentra archivos directa e indirectamente afectados
     */
    async findAffectedFiles(file) {
        const directly = [];
        const indirectly = [];
        // Directos: quién importa este archivo
        const node = this.graph.nodes.get(file);
        if (node) {
            directly.push(...node.consumers);
        }
        // Indirectos: quién importa a los directos
        for (const consumer of directly) {
            const consumerNode = this.graph.nodes.get(consumer);
            if (consumerNode) {
                indirectly.push(...consumerNode.consumers);
            }
        }
        return { directly, indirectly: [...new Set(indirectly)] };
    }
    /**
     * Calcula la cadena de cascada de dependencias
     */
    async calculateCascade(file, maxDepth = 3, depth = 0) {
        if (depth >= maxDepth)
            return [];
        const cascade = [];
        const node = this.graph.nodes.get(file);
        if (node) {
            for (const consumer of node.consumers) {
                cascade.push(consumer);
                cascade.push(...(await this.calculateCascade(consumer, maxDepth, depth + 1)));
            }
        }
        return [...new Set(cascade)];
    }
    /**
     * Clasifica consumidores en internos y externos
     */
    categorizeConsumers(directly, indirectly) {
        return {
            internal: [
                ...directly.filter(f => !f.includes('node_modules')),
                ...indirectly.filter(f => !f.includes('node_modules')),
            ],
            external: [
                ...directly.filter(f => f.includes('node_modules')),
                ...indirectly.filter(f => f.includes('node_modules')),
            ],
        };
    }
    /**
     * Calcula riesgo de un cambio (0-1)
     * Considera: breaking change, tipo, número de consumidores
     */
    calculateRisk(change) {
        let risk = 0;
        // Breaking changes son críticos
        if (change.breakingChange)
            risk += 0.5;
        // Severity adds risk
        switch (change.severity) {
            case 'critical':
                risk += 0.4;
                break;
            case 'high':
                risk += 0.3;
                break;
            case 'medium':
                risk += 0.15;
                break;
            case 'low':
                risk += 0.05;
                break;
        }
        // API changes son más riesgosas que refactoring
        if (change.type === 'api-change')
            risk += 0.15;
        if (change.type === 'removal')
            risk += 0.2;
        return Math.min(risk, 1);
    }
    /**
     * Estima días de trabajo para actualizar consumidores
     */
    estimateWorkload(affectedCount, hasBreaking) {
        let baseDays = Math.ceil(affectedCount / 5); // ~5 archivos por día
        if (hasBreaking)
            baseDays *= 1.5; // Breaking changes toman 50% más
        return Math.max(1, baseDays);
    }
    /**
     * Encuentra tipos TypeScript afectados
     */
    async findAffectedTypes(changes) {
        const types = new Set();
        for (const change of changes) {
            if (change.type === 'type-change' && change.newContent) {
                const match = change.newContent.match(/(?:type|interface)\s+(\w+)/);
                if (match)
                    types.add(match[1]);
            }
        }
        return Array.from(types);
    }
    /**
     * Encuentra funciones/métodos afectados
     */
    async findAffectedFunctions(changes) {
        const functions = new Set();
        for (const change of changes) {
            if (change.type === 'signature-change' && change.newContent) {
                const match = change.newContent.match(/(?:function|const)\s+(\w+)/);
                if (match)
                    functions.add(match[1]);
            }
        }
        return Array.from(functions);
    }
    /**
     * Extrae imports/requires de un archivo
     */
    extractImports(content, file) {
        const imports = new Set();
        // TypeScript/JavaScript imports
        const tsPattern = /import\s+(?:\{[^}]*\}|[\w*]+)\s+from\s+['"](\.\/[^'"]+)['"]/g;
        const esPattern = /^import\s+(?:\{[^}]*\}|[\w*]+)\s+from\s+['"](\.\/[^'"]+)['"]/gm;
        // CommonJS requires
        const cjsPattern = /require\(['"](\.\/[^'"]+)['"]\)/g;
        // Python imports
        const pyPattern = /(?:from\s+(\.+[.\w]*)|import\s+([.\w]+))/gm;
        let match;
        while ((match = tsPattern.exec(content)) !== null) {
            imports.add(this.resolveImportPath(match[1], file));
        }
        while ((match = cjsPattern.exec(content)) !== null) {
            imports.add(this.resolveImportPath(match[1], file));
        }
        return Array.from(imports);
    }
    /**
     * Extrae exports de un archivo
     */
    extractExports(content, file) {
        const exports = new Set();
        // export { foo, bar }
        const pattern = /export\s*\{([^}]+)\}/g;
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const items = match[1].split(',');
            for (const item of items) {
                const name = item.trim().split(' as ')[0].trim();
                if (name)
                    exports.add(name);
            }
        }
        // export function/const/class
        const defPattern = /export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+(\w+)/g;
        while ((match = defPattern.exec(content)) !== null) {
            exports.add(match[1]);
        }
        return Array.from(exports);
    }
    /**
     * Resuelve rutas de import relativas
     */
    resolveImportPath(importPath, fromFile) {
        const fromDir = fromFile.split('/').slice(0, -1).join('/');
        const resolved = join(fromDir, importPath);
        // Agregar extensiones comunes si falta
        for (const ext of ['.ts', '.js', '.tsx', '.jsx', '/index.ts', '/index.js']) {
            if (!resolved.endsWith(ext)) {
                continue;
            }
        }
        return resolved;
    }
    /**
     * Encuentra todos los archivos fuente en el repo
     */
    async findSourceFiles() {
        const files = [];
        async function walk(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
                        await walk(join(dir, entry.name));
                    }
                }
                else if (/\.(ts|js|tsx|jsx|py|java|go|rs)$/.test(entry.name)) {
                    files.push(join(dir, entry.name));
                }
            }
        }
        await walk(this.repoPath);
        return files;
    }
}
//# sourceMappingURL=ImpactCalculator.js.map