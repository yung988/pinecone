const fs = require('fs');
const https = require('https');
const http = require('http');

const SCIENTIFIC_SOURCES = {
  cern: {
    baseUrl: 'https://opendata.cern.ch/api/records',
    name: 'CERN Open Data'
  },
  inspire: {
    baseUrl: 'https://inspirehep.net/api/literature',
    name: 'INSPIRE-HEP'
  },
  nasa: {
    baseUrl: 'https://api.nasa.gov/planetary/apod',
    name: 'NASA Astrophysics'
  }
};

class ScientificDataFetcher {
  constructor() {
    this.dataDir = './world-research-data';
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    Object.keys(SCIENTIFIC_SOURCES).forEach(source => {
      const sourceDir = `${this.dataDir}/${source}`;
      if (!fs.existsSync(sourceDir)) {
        fs.mkdirSync(sourceDir, { recursive: true });
      }
    });
  }

  async fetchCERNData(maxRecords = 100) {
    console.log('Stahují se data z CERN Open Data...');
    
    const queries = [
      'type:Dataset+AND+experiment:CMS',
      'type:Dataset+AND+experiment:ATLAS', 
      'type:Dataset+AND+experiment:ALICE',
      'type:Dataset+AND+experiment:LHCb',
      'type:Documentation+AND+physics'
    ];

    const allData = [];
    
    for (const query of queries) {
      try {
        const url = `${SCIENTIFIC_SOURCES.cern.baseUrl}?q=${encodeURIComponent(query)}&size=${maxRecords}`;
        console.log(`Dotazuji CERN: ${query}`);
        
        const data = await this.httpGet(url);
        const jsonData = JSON.parse(data);
        
        if (jsonData.hits && jsonData.hits.hits) {
          const processedData = jsonData.hits.hits.map(hit => ({
            id: hit.id,
            title: hit.metadata.title,
            abstract: hit.metadata.abstract || '',
            experiment: hit.metadata.experiment || [],
            date_created: hit.metadata.date_created,
            collaboration: hit.metadata.collaboration || [],
            keywords: hit.metadata.keywords || [],
            type: hit.metadata.type,
            url: `https://opendata.cern.ch/record/${hit.id}`,
            source: 'CERN'
          }));
          
          allData.push(...processedData);
          console.log(`Nalezeno ${processedData.length} záznamů pro dotaz: ${query}`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Chyba při dotazu CERN (${query}):`, error.message);
      }
    }
    
    const filename = `${this.dataDir}/cern/cern_data.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    console.log(`CERN data uložena do: ${filename} (${allData.length} záznamů)`);
    
    return allData;
  }

  async fetchINSPIREData(maxRecords = 100) {
    console.log('Stahují se data z INSPIRE-HEP...');
    
    const topics = [
      'Higgs',
      'dark matter',
      'quantum gravity',
      'supersymmetry',
      'neutrinos',
      'black holes',
      'cosmology',
      'particle physics'
    ];

    const allData = [];
    
    for (const topic of topics) {
      try {
        const url = `${SCIENTIFIC_SOURCES.inspire.baseUrl}?q=${encodeURIComponent(topic)}&size=${maxRecords}&sort=mostrecent`;
        console.log(`Dotazuji INSPIRE-HEP: ${topic}`);
        
        const data = await this.httpGet(url);
        const jsonData = JSON.parse(data);
        
        if (jsonData.hits && jsonData.hits.hits) {
          const processedData = jsonData.hits.hits.map(hit => ({
            id: hit.id,
            title: hit.metadata.titles?.[0]?.title || 'Bez názvu',
            abstract: hit.metadata.abstracts?.[0]?.value || '',
            authors: hit.metadata.authors?.map(author => author.full_name) || [],
            date: hit.metadata.preprint_date || hit.metadata.publication_info?.[0]?.year,
            arxiv_eprint: hit.metadata.arxiv_eprints?.[0]?.value,
            journal: hit.metadata.publication_info?.[0]?.journal_title,
            keywords: hit.metadata.keywords?.map(kw => kw.value) || [],
            citations: hit.metadata.citation_count || 0,
            url: `https://inspirehep.net/literature/${hit.id}`,
            source: 'INSPIRE-HEP',
            topic: topic
          }));
          
          allData.push(...processedData);
          console.log(`Nalezeno ${processedData.length} článků pro téma: ${topic}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Chyba při dotazu INSPIRE-HEP (${topic}):`, error.message);
      }
    }
    
    const filename = `${this.dataDir}/inspire/inspire_data.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    console.log(`INSPIRE-HEP data uložena do: ${filename} (${allData.length} záznamů)`);
    
    return allData;
  }

  async fetchPhysicsEducationData() {
    console.log('Stahují se vzdělávací zdroje...');
    
    // PhET simulace od University of Colorado
    const phetSimulations = [
      'quantum-tunneling',
      'wave-interference', 
      'photoelectric-effect',
      'rutherford-scattering',
      'nuclear-physics',
      'lasers',
      'blackbody-spectrum'
    ];

    const educationalData = [];
    
    for (const sim of phetSimulations) {
      educationalData.push({
        title: `PhET: ${sim.replace('-', ' ')}`,
        type: 'Interactive Simulation',
        url: `https://phet.colorado.edu/sims/html/${sim}/latest/${sim}_en.html`,
        description: `Interactive physics simulation: ${sim}`,
        source: 'PhET/University of Colorado',
        category: 'Educational'
      });
    }
    
    // MIT OpenCourseWare fyzika kurzy
    const mitCourses = [
      { id: '8.01sc', name: 'Classical Mechanics' },
      { id: '8.02', name: 'Electricity and Magnetism' },
      { id: '8.03sc', name: 'Vibrations and Waves' },
      { id: '8.04', name: 'Quantum Physics I' },
      { id: '8.05', name: 'Quantum Physics II' },
      { id: '8.06', name: 'Quantum Physics III' },
      { id: '8.07', name: 'Electrodynamics' },
      { id: '8.08', name: 'Statistical Physics' }
    ];
    
    mitCourses.forEach(course => {
      educationalData.push({
        title: `MIT ${course.id}: ${course.name}`,
        type: 'University Course',
        url: `https://ocw.mit.edu/courses/physics/${course.id}-physics-${course.name.toLowerCase().replace(/ /g, '-')}/`,
        description: `MIT OpenCourseWare: ${course.name}`,
        source: 'MIT OpenCourseWare',
        category: 'Educational'
      });
    });
    
    const filename = `${this.dataDir}/educational/physics_education.json`;
    if (!fs.existsSync(`${this.dataDir}/educational`)) {
      fs.mkdirSync(`${this.dataDir}/educational`, { recursive: true });
    }
    fs.writeFileSync(filename, JSON.stringify(educationalData, null, 2));
    console.log(`Vzdělávací data uložena do: ${filename}`);
    
    return educationalData;
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const options = {
        headers: {
          'User-Agent': 'Physics Research Data Fetcher 1.0',
          'Accept': 'application/json'
        }
      };
      
      client.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  async fetchAllWorldResearchData() {
    console.log('🌍 Začínám stahování dat ze světového fyzikálního výzkumu...');
    
    const results = {};
    
    try {
      results.cern = await this.fetchCERNData(200);
    } catch (error) {
      console.error('Chyba při stahování CERN dat:', error.message);
    }
    
    try {
      results.inspire = await this.fetchINSPIREData(300);
    } catch (error) {
      console.error('Chyba při stahování INSPIRE dat:', error.message);
    }
    
    try {
      results.educational = await this.fetchPhysicsEducationData();
    } catch (error) {
      console.error('Chyba při stahování vzdělávacích dat:', error.message);
    }
    
    // Souhrnný report
    const summary = {
      timestamp: new Date().toISOString(),
      total_records: Object.values(results).reduce((sum, data) => sum + (data?.length || 0), 0),
      sources: Object.keys(results).map(source => ({
        name: source,
        records: results[source]?.length || 0
      }))
    };
    
    const summaryFile = `${this.dataDir}/fetch_summary.json`;
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Souhrn stahování:');
    console.log(`   Celkem záznamů: ${summary.total_records}`);
    summary.sources.forEach(source => {
      console.log(`   ${source.name}: ${source.records} záznamů`);
    });
    console.log(`\n✅ Stahování dokončeno! Data uložena v: ${this.dataDir}`);
    
    return results;
  }
}

module.exports = ScientificDataFetcher;

// Pokud je spuštěn přímo
if (require.main === module) {
  const fetcher = new ScientificDataFetcher();
  fetcher.fetchAllWorldResearchData();
}

