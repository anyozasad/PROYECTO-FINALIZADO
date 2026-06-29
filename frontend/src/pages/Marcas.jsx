import AdminCrudSimple from './AdminCrudSimple';
export default function Marcas(){return <AdminCrudSimple titulo="Marcas" recurso="marcas" campos={[{name:'nombre',label:'Marca',required:true},{name:'descripcion',label:'Descripción'},{name:'estado',label:'Estado',default:1,type:'number'}]} />;}
