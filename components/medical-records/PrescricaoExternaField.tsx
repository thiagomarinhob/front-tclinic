'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

export interface PrescricaoExternaItem {
  medicamento: string;
  posologia: string;
}

interface PrescricaoExternaFieldProps {
  value: PrescricaoExternaItem[];
  onChange: (items: PrescricaoExternaItem[]) => void;
  disabled?: boolean;
  controlled?: boolean;
}

const MEDICAMENTOS_COMUNS = [
  'Dipirona Sódica 500mg comprimido',
  'Dipirona Sódica 1g comprimido',
  'Dipirona Sódica 500mg/mL solução oral (gotas)',
  'Paracetamol 500mg comprimido',
  'Paracetamol 750mg comprimido',
  'Paracetamol 200mg/mL solução oral (gotas)',
  'Ibuprofeno 200mg comprimido',
  'Ibuprofeno 400mg comprimido',
  'Ibuprofeno 600mg comprimido',
  'Nimesulida 100mg comprimido',
  'Diclofenaco Sódico 50mg comprimido',
  'Diclofenaco Potássico 50mg comprimido',
  'Ketoprofeno 50mg comprimido',
  'Naproxeno 500mg comprimido',
  'AAS 100mg comprimido',
  'AAS 500mg comprimido',
  'Amoxicilina 500mg cápsula',
  'Amoxicilina 875mg comprimido',
  'Amoxicilina 250mg/5mL suspensão oral',
  'Amoxicilina + Clavulanato 875mg/125mg comprimido',
  'Amoxicilina + Clavulanato 400mg/57mg suspensão oral',
  'Azitromicina 500mg comprimido',
  'Azitromicina 250mg comprimido',
  'Azitromicina 200mg/5mL suspensão oral',
  'Cefalexina 500mg cápsula',
  'Cefalexina 250mg/5mL suspensão oral',
  'Ciprofloxacino 500mg comprimido',
  'Ciprofloxacino 250mg comprimido',
  'Clindamicina 300mg cápsula',
  'Clindamicina 600mg comprimido',
  'Doxiciclina 100mg cápsula',
  'Eritromicina 500mg comprimido',
  'Metronidazol 250mg comprimido',
  'Metronidazol 400mg comprimido',
  'Metronidazol 250mg/5mL suspensão oral',
  'Nitrofurantoína 100mg cápsula',
  'Sulfametoxazol + Trimetoprima 400mg/80mg comprimido',
  'Sulfametoxazol + Trimetoprima 800mg/160mg comprimido',
  'Fosfomicina 3g sachê',
  'Fluconazol 150mg cápsula',
  'Fluconazol 50mg cápsula',
  'Ivermectina 6mg comprimido',
  'Albendazol 400mg comprimido',
  'Mebendazol 100mg comprimido',
  'Prednisona 5mg comprimido',
  'Prednisona 20mg comprimido',
  'Prednisolona 3mg/mL solução oral',
  'Dexametasona 4mg comprimido',
  'Dexametasona 0,1mg/mL solução oral',
  'Betametasona 0,64mg comprimido',
  'Omeprazol 20mg cápsula',
  'Omeprazol 40mg cápsula',
  'Pantoprazol 40mg comprimido',
  'Ranitidina 150mg comprimido',
  'Hidróxido de Alumínio + Magnésio suspensão oral',
  'Sucralfato 1g suspensão oral',
  'Metoclopramida 10mg comprimido',
  'Domperidona 10mg comprimido',
  'Ondansetrona 4mg comprimido',
  'Ondansetrona 8mg comprimido',
  'Bromoprida 10mg comprimido',
  'Buscopan 10mg comprimido',
  'Buscopan Composto comprimido',
  'Simeticona 40mg cápsula',
  'Loperamida 2mg cápsula',
  'Soro de Reidratação Oral sachê',
  'Loratadina 10mg comprimido',
  'Loratadina 1mg/mL xarope',
  'Cetirizina 10mg comprimido',
  'Fexofenadina 120mg comprimido',
  'Fexofenadina 180mg comprimido',
  'Dexclorfeniramina 2mg comprimido',
  'Dexclorfeniramina 0,4mg/mL xarope',
  'Desloratadina 5mg comprimido',
  'Montelucaste 10mg comprimido',
  'Montelucaste 5mg comprimido mastigável',
  'Montelucaste 4mg sachê',
  'Salbutamol 100mcg aerossol (spray)',
  'Fenoterol 5mg/mL solução para nebulização',
  'Budesonida 200mcg aerossol',
  'Brometo de Ipratrópio 250mcg/mL solução para nebulização',
  'Ambroxol 30mg comprimido',
  'Ambroxol 15mg/5mL xarope',
  'Acetilcisteína 600mg efervescente',
  'Dextrometorfano + Guaifenesina xarope',
  'Dexmine xarope',
  'Benalet xarope',
  'Atenolol 25mg comprimido',
  'Atenolol 50mg comprimido',
  'Atenolol 100mg comprimido',
  'Propranolol 40mg comprimido',
  'Metoprolol 50mg comprimido',
  'Metoprolol 100mg comprimido',
  'Carvedilol 6,25mg comprimido',
  'Carvedilol 12,5mg comprimido',
  'Losartana Potássica 50mg comprimido',
  'Losartana Potássica 100mg comprimido',
  'Valsartana 80mg comprimido',
  'Valsartana 160mg comprimido',
  'Enalapril 5mg comprimido',
  'Enalapril 10mg comprimido',
  'Enalapril 20mg comprimido',
  'Captopril 25mg comprimido',
  'Captopril 50mg comprimido',
  'Anlodipino 5mg comprimido',
  'Anlodipino 10mg comprimido',
  'Nifedipino 10mg cápsula',
  'Hidroclorotiazida 25mg comprimido',
  'Furosemida 40mg comprimido',
  'Espironolactona 25mg comprimido',
  'Sinvastatina 10mg comprimido',
  'Sinvastatina 20mg comprimido',
  'Sinvastatina 40mg comprimido',
  'Atorvastatina 10mg comprimido',
  'Atorvastatina 20mg comprimido',
  'Atorvastatina 40mg comprimido',
  'Rosuvastatina 10mg comprimido',
  'Metformina 500mg comprimido',
  'Metformina 850mg comprimido',
  'Metformina 1g comprimido',
  'Glibenclamida 5mg comprimido',
  'Glicazida 30mg comprimido',
  'Glicazida 60mg comprimido',
  'Levotiroxina 25mcg comprimido',
  'Levotiroxina 50mcg comprimido',
  'Levotiroxina 75mcg comprimido',
  'Levotiroxina 100mcg comprimido',
  'Levotiroxina 125mcg comprimido',
  'Ácido Fólico 5mg comprimido',
  'Sulfato Ferroso 40mg comprimido',
  'Vitamina D3 1000UI cápsula',
  'Vitamina D3 2000UI cápsula',
  'Vitamina D3 7000UI cápsula',
  'Vitamina C 500mg comprimido',
  'Complexo B comprimido',
  'Cálcio + Vitamina D comprimido',
  'Cianocobalamina (B12) 1000mcg comprimido',
  'Piridoxina (B6) 40mg comprimido',
  'Betaistina 16mg comprimido',
  'Dimenidrinato + Piridoxina 50mg comprimido',
  'Clopidogrel 75mg comprimido',
  'Varfarina 5mg comprimido',
  'Amitriptilina 25mg comprimido',
  'Nortriptilina 25mg comprimido',
  'Fluoxetina 20mg comprimido',
  'Sertralina 50mg comprimido',
  'Sertralina 100mg comprimido',
  'Escitalopram 10mg comprimido',
  'Escitalopram 20mg comprimido',
  'Bupropiona 150mg comprimido',
  'Carbamazepina 200mg comprimido',
  'Gabapentina 300mg cápsula',
  'Gabapentina 400mg cápsula',
  'Pregabalina 75mg cápsula',
  'Pregabalina 150mg cápsula',
  'Tramadol 50mg cápsula',
  'Codeína 30mg comprimido',
];

const MEDICAMENTOS_CONTROLADOS = [
  'Alprazolam 0,25mg comprimido',
  'Alprazolam 0,5mg comprimido',
  'Alprazolam 1mg comprimido',
  'Clonazepam 0,5mg comprimido',
  'Clonazepam 2mg comprimido',
  'Diazepam 5mg comprimido',
  'Diazepam 10mg comprimido',
  'Lorazepam 1mg comprimido',
  'Lorazepam 2mg comprimido',
  'Midazolam 7,5mg comprimido',
  'Bromazepam 3mg comprimido',
  'Bromazepam 6mg comprimido',
  'Nitrazepam 5mg comprimido',
  'Zolpidem 5mg comprimido',
  'Zolpidem 10mg comprimido',
  'Fenobarbital 100mg comprimido',
  'Carbamazepina 200mg comprimido',
  'Carbamazepina 400mg comprimido',
  'Amitriptilina 25mg comprimido',
  'Amitriptilina 75mg comprimido',
  'Nortriptilina 25mg comprimido',
  'Nortriptilina 50mg comprimido',
  'Imipramina 25mg comprimido',
  'Fluoxetina 20mg comprimido',
  'Fluoxetina 40mg comprimido',
  'Sertralina 50mg comprimido',
  'Sertralina 100mg comprimido',
  'Paroxetina 20mg comprimido',
  'Escitalopram 10mg comprimido',
  'Escitalopram 20mg comprimido',
  'Bupropiona 150mg comprimido',
  'Bupropiona 300mg comprimido',
  'Venlafaxina 75mg cápsula',
  'Venlafaxina 150mg cápsula',
  'Duloxetina 30mg cápsula',
  'Duloxetina 60mg cápsula',
  'Citalopram 20mg comprimido',
  'Quetiapina 25mg comprimido',
  'Quetiapina 100mg comprimido',
  'Olanzapina 5mg comprimido',
  'Olanzapina 10mg comprimido',
  'Risperidona 2mg comprimido',
  'Risperidona 3mg comprimido',
  'Haloperidol 1mg comprimido',
  'Haloperidol 5mg comprimido',
  'Clozapina 100mg comprimido',
  'Lítio 300mg comprimido',
  'Topiramato 25mg comprimido',
  'Topiramato 50mg comprimido',
  'Lamotrigina 25mg comprimido',
  'Lamotrigina 50mg comprimido',
  'Lamotrigina 100mg comprimido',
  'Valproato de Sódio 250mg comprimido',
  'Valproato de Sódio 500mg comprimido',
  'Ácido Valproico 500mg comprimido',
  'Fenitoína 100mg comprimido',
  'Levetiracetam 250mg comprimido',
  'Levetiracetam 500mg comprimido',
  'Metilfenidato 10mg comprimido',
  'Metilfenidato 20mg comprimido',
  'Tramadol 50mg cápsula',
  'Tramadol 100mg comprimido',
  'Codeína 30mg comprimido',
  'Morfina 10mg comprimido',
  'Morfina 30mg comprimido',
  'Oxicodona 5mg comprimido',
  'Oxicodona 10mg comprimido',
  'Tapentadol 50mg comprimido',
  'Buprenorfina 0,2mg comprimido sublingual',
  'Metadona 10mg comprimido',
  'Pregabalina 75mg cápsula',
  'Pregabalina 150mg cápsula',
  'Pregabalina 300mg cápsula',
  'Gabapentina 300mg cápsula',
  'Gabapentina 400mg cápsula',
];

export function PrescricaoExternaField({
  value,
  onChange,
  disabled,
  controlled = false,
}: PrescricaoExternaFieldProps) {
  const lista = controlled ? MEDICAMENTOS_CONTROLADOS : MEDICAMENTOS_COMUNS;

  const [digitarNome, setDigitarNome] = useState(false);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState('');
  const [medicamentoDigitado, setMedicamentoDigitado] = useState('');
  const [posologia, setPosologia] = useState('');

  const medicamentoAtual = digitarNome ? medicamentoDigitado.trim() : medicamentoSelecionado;

  const handleAdd = useCallback(() => {
    if (!medicamentoAtual) return;
    onChange([...value, { medicamento: medicamentoAtual, posologia: posologia.trim() }]);
    setMedicamentoSelecionado('');
    setMedicamentoDigitado('');
    setPosologia('');
  }, [medicamentoAtual, posologia, value, onChange]);

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium">{idx + 1}. {item.medicamento}</span>
                {item.posologia && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Posologia: {item.posologia}
                  </p>
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="digitar-nome"
              checked={digitarNome}
              onCheckedChange={(v) => {
                setDigitarNome(!!v);
                setMedicamentoSelecionado('');
                setMedicamentoDigitado('');
              }}
            />
            <Label htmlFor="digitar-nome" className="text-xs cursor-pointer font-normal text-muted-foreground">
              Digitar nome (medicamento não listado)
            </Label>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {controlled ? 'Medicamento controlado' : 'Medicamento'}
              </p>
              {digitarNome ? (
                <Input
                  placeholder="Digite o nome e dosagem..."
                  value={medicamentoDigitado}
                  onChange={(e) => setMedicamentoDigitado(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                />
              ) : (
                <Select value={medicamentoSelecionado} onValueChange={setMedicamentoSelecionado}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o medicamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lista.map((med) => (
                      <SelectItem key={med} value={med}>{med}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Posologia</p>
              <Input
                placeholder="Ex: 1 comp. de 8/8h por 5 dias"
                value={posologia}
                onChange={(e) => setPosologia(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAdd}
              disabled={!medicamentoAtual}
              title="Adicionar medicamento"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {value.length === 0 && disabled && (
        <p className="text-sm text-muted-foreground">Nenhum medicamento prescrito.</p>
      )}
    </div>
  );
}
