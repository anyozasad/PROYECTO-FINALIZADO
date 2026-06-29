import AdminCrudSimple from './AdminCrudSimple';
export default function MetodosPago(){return <AdminCrudSimple titulo="Métodos de pago" recurso="metodos_pago" campos={[{name:'nombre',label:'Método',required:true},{name:'descripcion',label:'Descripción'},{name:'estado',label:'Estado',type:'number',default:1}]} />;}
