import { Perfil } from './Perfil';

export class Usuario {
  
  constructor(
    public uid: string,
    public email: string,
    public nome: string,
    public urlFoto: string,
    public perfil: Perfil,
    public nivelAtual?: string,
    public coeficienteConhecimento?: number,
    public diasInatividade?: number,
    public dataUltimoAcesso?: string,
    public createdAt?: any,
    public diasAtivos?: number,
    public diasLogin?: string[], // Array de datas de login no formato 'YYYY-MM-DD'
    public senha?: string,
  ) {
    this.uid = uid;
    this.email = email;
    this.nome = nome;
    this.urlFoto = urlFoto;
    this.perfil = perfil;
    this.nivelAtual = nivelAtual;
    this.coeficienteConhecimento = coeficienteConhecimento;
    this.diasInatividade = diasInatividade;
    this.dataUltimoAcesso = dataUltimoAcesso;
    this.createdAt = createdAt;
    this.diasAtivos = diasAtivos;
    this.diasLogin = diasLogin || [];
    this.senha = senha;
  }
}
