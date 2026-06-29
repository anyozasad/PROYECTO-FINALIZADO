import AdminCrudSimple from './AdminCrudSimple';
export default function Proveedores(){return <AdminCrudSimple titulo="Proveedores" recurso="proveedores" campos={[{name:'nombre',label:'Proveedor',required:true},{name:'ruc',label:'RUC'},{name:'telefono',label:'Teléfono'},{name:'email',label:'Correo'},{name:'direccion',label:'Dirección',col:'col-md-4'}]} />;}
