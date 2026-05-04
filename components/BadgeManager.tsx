import { Badge } from "@/model/Badge";
import { Curso } from "@/model/Curso";
import { BadgeAdminService } from "@/services/badge/BadgeAdminService";
import { CursoService } from "@/services/curso/CursoService";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import {
    Button,
    Card,
    Chip,
    Dialog,
    Icon,
    IconButton,
    Menu,
    Modal,
    Portal,
    Searchbar,
    Text,
    TextInput,
    useTheme
} from "react-native-paper";
import { IconPickerModal } from "./IconPickerModal";

interface BadgeManagerProps {
  visible: boolean;
  onDismiss: () => void;
}

export function BadgeManager({ visible, onDismiss }: BadgeManagerProps) {
  const theme = useTheme();
  const [iconPickerVisivel, setIconPickerVisivel] = useState(false);

  // Estados principais
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  
  // Estados para CRUD de Badges
  const [badges, setBadges] = useState<Badge[]>([]);
  const [carregandoBadges, setCarregandoBadges] = useState(false);
  const [searchBadges, setSearchBadges] = useState("");
  const [mostrarTodasBadges, setMostrarTodasBadges] = useState(false);
  const [cursosDisponiveis, setCursosDisponiveis] = useState<Curso[]>([]);

  // Campos do formulário de badge
  const [badgeEditando, setBadgeEditando] = useState<Badge | null>(null);
  const [badgeId, setBadgeId] = useState("");
  const [badgeNome, setBadgeNome] = useState("");
  const [badgeIcone, setBadgeIcone] = useState("");
  const [badgeDescricao, setBadgeDescricao] = useState("");
  const [badgeTipo, setBadgeTipo] = useState<"curso" | "conquista" | "especial" | "ranking">("conquista");
  const [badgeRequisitoTipo, setBadgeRequisitoTipo] = useState<
    | "curso_concluido"
    | "primeiro_curso"
    | "multiplos_cursos"
    | "coeficiente_alto"
    | "sequencia_dias"
    | "ranking_posicao"
    | "perfil_especifico"
    | "primeiro_login"
  >("primeiro_curso");
  const [badgeRequisitoValor, setBadgeRequisitoValor] = useState("");
  const [badgeRequisitoCursoId, setBadgeRequisitoCursoId] = useState("");
  const [badgeRequisitoPerfil, setBadgeRequisitoPerfil] = useState<"Colaborador" | "Moderador" | "">("");

  // Refs de formulário
  const badgeNomeRef = useRef<any>(null);
  const badgeIconeRef = useRef<any>(null);
  const badgeDescricaoRef = useRef<any>(null);
  const badgeValorRef = useRef<any>(null);

  // Estados para Menus Dropdown
  const [menuTipoVisivel, setMenuTipoVisivel] = useState(false);
  const [menuRequisitoVisivel, setMenuRequisitoVisivel] = useState(false);
  const [menuCursoVisivel, setMenuCursoVisivel] = useState(false);
  const [menuPerfilVisivel, setMenuPerfilVisivel] = useState(false);

  // Feedback
  const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });
  const [dialogMensagemVisivel, setDialogMensagemVisivel] = useState(false);

  useEffect(() => {
    if (visible) {
      if (viewMode === 'list') {
        carregarBadges();
        carregarCursos(); // Carregar cursos para o dropdown antecipadamente ou sob demanda
      }
    }
  }, [visible, viewMode]);

  const carregarCursos = useCallback(async () => {
    try {
      const cursos = await CursoService.listarCursos();
      setCursosDisponiveis(cursos);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    }
  }, []);

  const carregarBadges = useCallback(async () => {
    setCarregandoBadges(true);
    try {
      const badgesFirestore = await BadgeAdminService.listarBadges();
      setBadges(badgesFirestore);
    } catch (error) {
      console.error("Erro ao carregar badges:", error);
      mostrarMensagem("erro", "Erro ao carregar badges");
    } finally {
      setCarregandoBadges(false);
    }
  }, []);

  const mostrarMensagem = (tipo: string, msg: string) => {
    setMensagem({ tipo, mensagem: msg });
    setDialogMensagemVisivel(true);
  };

  function abrirFormularioNovaBadge() {
    limparFormularioBadge();
    setViewMode("form");
  }

  function abrirFormularioEditarBadge(badge: Badge) {
    setBadgeEditando(badge);
    setBadgeId(badge.id);
    setBadgeNome(badge.nome);
    setBadgeIcone(badge.icone);
    setBadgeDescricao(badge.descricao);
    setBadgeTipo(badge.tipo);
    setBadgeRequisitoTipo(badge.requisitos.tipo);
    setBadgeRequisitoValor(badge.requisitos.valor?.toString() || "");
    setBadgeRequisitoCursoId(badge.requisitos.cursoId || "");
    setBadgeRequisitoPerfil(badge.requisitos.perfil || "");
    setViewMode("form");
  }

  function limparFormularioBadge() {
    setBadgeEditando(null);
    setBadgeId("");
    setBadgeNome("");
    setBadgeIcone("");
    setBadgeDescricao("");
    setBadgeTipo("conquista");
    setBadgeRequisitoTipo("primeiro_curso");
    setBadgeRequisitoValor("");
    setBadgeRequisitoCursoId("");
    setBadgeRequisitoPerfil("");
  }

  async function salvarBadge() {
    if (!badgeNome.trim()) return mostrarMensagem("erro", "Nome é obrigatório");
    if (!badgeIcone.trim()) return mostrarMensagem("erro", "Ícone é obrigatório");
    if (!badgeDescricao.trim()) return mostrarMensagem("erro", "Descrição é obrigatória");

    let finalBadgeId = badgeId;
    if (!badgeEditando) {
      finalBadgeId = badgeId.trim() || BadgeAdminService.gerarIdSugerido(badgeNome);
      if (!BadgeAdminService.validarIdBadge(finalBadgeId)) {
        return mostrarMensagem("erro", "ID inválido. Use letras minúsculas, números, _ e -");
      }
    }

    try {
      const badge: any = {
        id: finalBadgeId,
        nome: badgeNome.trim(),
        icone: badgeIcone.trim(),
        descricao: badgeDescricao.trim(),
        tipo: badgeTipo,
        requisitos: { tipo: badgeRequisitoTipo },
      };

      if (badgeRequisitoTipo === "curso_concluido") {
        if (!badgeRequisitoCursoId.trim()) return mostrarMensagem("erro", "Selecione um curso");
        badge.requisitos.cursoId = badgeRequisitoCursoId.trim();
      } else if (badgeRequisitoTipo === "perfil_especifico") {
        if (!badgeRequisitoPerfil) return mostrarMensagem("erro", "Selecione um perfil");
        badge.requisitos.perfil = badgeRequisitoPerfil;
      } else if (["multiplos_cursos", "coeficiente_alto", "sequencia_dias", "ranking_posicao"].includes(badgeRequisitoTipo)) {
        const valor = parseInt(badgeRequisitoValor);
        if (isNaN(valor) || valor <= 0) return mostrarMensagem("erro", "Valor deve ser positivo");
        badge.requisitos.valor = valor;
      }

      if (badgeEditando) {
        await BadgeAdminService.atualizarBadge(finalBadgeId, badge);
        mostrarMensagem("sucesso", "Badge atualizada!");
      } else {
        await BadgeAdminService.criarBadge(badge);
        mostrarMensagem("sucesso", "Badge criada!");
      }

      limparFormularioBadge();
      setViewMode("list");
      carregarBadges();
    } catch (error: any) {
      console.error("Erro ao salvar badge:", error);
      mostrarMensagem("erro", error.message || "Erro ao salvar badge");
    }
  }

  async function excluirBadge(badgeId: string) {
    try {
      await BadgeAdminService.excluirBadge(badgeId);
      mostrarMensagem("sucesso", "Badge excluída!");
      carregarBadges();
    } catch (error: any) {
      mostrarMensagem("erro", error.message || "Erro ao excluir badge");
    }
  }

  // Helpers de Label
  function getBadgeTipoLabel(tipo: string): string {
    const tipos: any = { curso: "Curso", conquista: "Conquista", especial: "Especial", ranking: "Ranking" };
    return tipos[tipo] || tipo;
  }
  function getRequisitoTipoLabel(tipo: string): string {
    const tipos: any = { primeiro_curso: "Primeiro Curso", curso_concluido: "Curso Específico", multiplos_cursos: "Múltiplos Cursos", coeficiente_alto: "Coeficiente", sequencia_dias: "Sequência Dias", ranking_posicao: "Ranking", perfil_especifico: "Perfil", primeiro_login: "Primeiro Login" };
    return tipos[tipo] || tipo;
  }
  function getRequisitoLabel(requisito: any): string {
    switch (requisito.tipo) {
      case "primeiro_curso": return "Primeiro curso concluído";
      case "primeiro_login": return "Primeiro login no app";
      case "perfil_especifico": return `Perfil: ${requisito.perfil || "?"}`;
      case "curso_concluido": return `Concluir curso: ${requisito.cursoId || "?"}`;
      case "multiplos_cursos": return `Concluir ${requisito.valor} cursos`;
      case "coeficiente_alto": return `Coeficiente ≥ ${requisito.valor}%`;
      case "sequencia_dias": return `${requisito.valor} dias consecutivos`;
      case "ranking_posicao": return `Top ${requisito.valor} no ranking`;
      default: return requisito.tipo;
    }
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: theme.colors.background,
          margin: 20,
          borderRadius: 12,
          height: "90%",
          padding: 0, 
        }}
      >
        <View style={{ flex: 1, overflow: 'hidden', borderRadius: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }}>
                {viewMode === 'form' && (
                    <IconButton icon="arrow-left" onPress={() => setViewMode('list')} />
                )}
                <Text variant="titleLarge" style={{ flex: 1, fontWeight: 'bold' }}>
                    {viewMode === 'list' ? "Gerenciar Badges" : (badgeEditando ? "Editar Badge" : "Nova Badge")}
                </Text>
                <IconButton icon="close" onPress={onDismiss} />
            </View>

            <View style={{ flex: 1 }}>
                {viewMode === 'list' ? (
                    // LISTA DE BADGES
                    <View style={{ flex: 1, padding: 16 }}>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                             <Searchbar
                                placeholder="Buscar..."
                                onChangeText={setSearchBadges}
                                value={searchBadges}
                                style={{ flex: 1, height: 48 }}
                                inputStyle={{ minHeight: 0 }} 
                            />
                            <Button mode="contained" onPress={abrirFormularioNovaBadge} icon="plus" compact contentStyle={{ height: 48 }}>
                                Nova
                            </Button>
                        </View>
                        
                        {carregandoBadges ? (
                             <Text style={{ textAlign: "center", marginTop: 20 }}>Carregando...</Text>
                        ) : (
                            <FlatList
                                data={badges.filter((b) => !searchBadges || b.nome.toLowerCase().includes(searchBadges.toLowerCase()))}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20, color: theme.colors.onSurfaceVariant }}>Nenhuma badge encontrada.</Text>}
                                renderItem={({ item }) => (
                                    <Card style={{ marginBottom: 8, backgroundColor: theme.colors.surfaceVariant }}>
                                        <Card.Content>
                                            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                                                 <View style={{ marginRight: 12, justifyContent: 'center', alignItems: 'center', width: 40 }}>
                                                    <Icon source={item.icone || "star"} size={32} color={theme.colors.primary} />
                                                 </View>
                                                 <View style={{ flex: 1 }}>
                                                    <Text variant="titleMedium" style={{ fontWeight: "bold" }}>{item.nome}</Text>
                                                    <Chip compact style={{ alignSelf: "flex-start", marginVertical: 4 }}>{getBadgeTipoLabel(item.tipo)}</Chip>
                                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.descricao}</Text>
                                                    <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 4 }}>{getRequisitoLabel(item.requisitos)}</Text>
                                                 </View>
                                                 <View>
                                                     <IconButton icon="pencil" size={20} onPress={() => abrirFormularioEditarBadge(item)} />
                                                     <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => {
                                                         Alert.alert("Excluir", "Tem certeza?", [
                                                             { text: "Cancelar" },
                                                             { text: "Excluir", style: "destructive", onPress: () => excluirBadge(item.id) }
                                                         ])
                                                     }} />
                                                 </View>
                                            </View>
                                        </Card.Content>
                                    </Card>
                                )}
                            />
                        )}
                    </View>
                ) : (
                    // FORMULÁRIO
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: 16 }}>
                            <TextInput label="ID (Opcional)" value={badgeId} onChangeText={setBadgeId} mode="outlined" disabled={!!badgeEditando} style={{ marginBottom: 12 }} placeholder="automático se vazio"/>
                            <TextInput label="Nome *" value={badgeNome} onChangeText={setBadgeNome} mode="outlined" style={{ marginBottom: 12 }} ref={badgeNomeRef} returnKeyType="next" onSubmitEditing={() => badgeIconeRef.current?.focus()}/>
                            <View style={{ marginBottom: 12 }}>
                                <Text variant="labelMedium" style={{ marginBottom: 4, color: theme.colors.onSurfaceVariant }}>Ícone *</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                    <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: theme.colors.surfaceVariant }}>
                                        <Icon source={badgeIcone || "star"} size={32} color={theme.colors.primary} />
                                    </View>
                                    <Button mode="outlined" onPress={() => setIconPickerVisivel(true)} style={{ flex: 1 }}>
                                        {badgeIcone ? badgeIcone : "Escolher Ícone"}
                                    </Button>
                                </View>
                            </View>
                            <TextInput label="Descrição *" value={badgeDescricao} onChangeText={setBadgeDescricao} mode="outlined" multiline numberOfLines={2} style={{ marginBottom: 12 }} ref={badgeDescricaoRef}/>

                             {/* TIPO DA BADGE */}
                             <Text variant="titleSmall" style={{ marginTop: 8 }}>Tipo da Badge</Text>
                             <Menu visible={menuTipoVisivel} onDismiss={() => setMenuTipoVisivel(false)} anchor={<Button mode="outlined" onPress={() => setMenuTipoVisivel(true)} style={{ marginVertical: 8 }}>{getBadgeTipoLabel(badgeTipo)}</Button>}>
                                {["curso", "conquista", "especial", "ranking"].map(t => (
                                    <Menu.Item key={t} onPress={() => { setBadgeTipo(t as any); setMenuTipoVisivel(false); }} title={getBadgeTipoLabel(t)} />
                                ))}
                             </Menu>

                              {/* TIPO DE REQUISITO */}
                             <Text variant="titleSmall" style={{ marginTop: 8 }}>Requisito</Text>
                             <Menu visible={menuRequisitoVisivel} onDismiss={() => setMenuRequisitoVisivel(false)} anchor={<Button mode="outlined" onPress={() => setMenuRequisitoVisivel(true)} style={{ marginVertical: 8 }}>{getRequisitoTipoLabel(badgeRequisitoTipo)}</Button>}>
                                {["primeiro_curso", "curso_concluido", "multiplos_cursos", "coeficiente_alto", "sequencia_dias", "ranking_posicao", "perfil_especifico", "primeiro_login"].map(t => (
                                    <Menu.Item key={t} onPress={() => { setBadgeRequisitoTipo(t as any); setMenuRequisitoVisivel(false); }} title={getRequisitoTipoLabel(t)} />
                                ))}
                             </Menu>

                             {/* CONDICIONAIS DE REQUISITO */}
                             {badgeRequisitoTipo === "curso_concluido" && (
                                 <Menu visible={menuCursoVisivel} onDismiss={() => setMenuCursoVisivel(false)} anchor={<Button mode="outlined" onPress={() => setMenuCursoVisivel(true)} style={{ marginBottom: 16 }}>{ cursosDisponiveis.find(c => c.id === badgeRequisitoCursoId)?.titulo || "Selecione um Curso" }</Button>}>
                                     {cursosDisponiveis.map(c => <Menu.Item key={c.id} onPress={() => { setBadgeRequisitoCursoId(c.id); setMenuCursoVisivel(false); }} title={c.titulo} />)}
                                 </Menu>
                             )}
                             {badgeRequisitoTipo === "perfil_especifico" && (
                                 <Menu visible={menuPerfilVisivel} onDismiss={() => setMenuPerfilVisivel(false)} anchor={<Button mode="outlined" onPress={() => setMenuPerfilVisivel(true)} style={{ marginBottom: 16 }}>{ badgeRequisitoPerfil || "Selecione um Perfil" }</Button>}>
                                     {["Colaborador", "Moderador"].map(p => <Menu.Item key={p} onPress={() => { setBadgeRequisitoPerfil(p as any); setMenuPerfilVisivel(false); }} title={p} />)}
                                 </Menu>
                             )}
                             {["multiplos_cursos", "coeficiente_alto", "sequencia_dias", "ranking_posicao"].includes(badgeRequisitoTipo) && (
                                 <TextInput label="Valor *" value={badgeRequisitoValor} onChangeText={setBadgeRequisitoValor} keyboardType="numeric" mode="outlined" style={{ marginBottom: 16 }} ref={badgeValorRef}/>
                             )}
                        </ScrollView>
                        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                             <Button onPress={() => setViewMode('list')}>Cancelar</Button>
                             <Button mode="contained" onPress={salvarBadge}>Salvar</Button>
                        </View>
                    </KeyboardAvoidingView>
                )}
            </View>
        </View>

        <IconPickerModal
          visible={iconPickerVisivel}
          onDismiss={() => setIconPickerVisivel(false)}
          selectedIcon={badgeIcone}
          onSelect={(nome) => setBadgeIcone(nome)}
        />

        {/* Dialog Mensagem Interno */}
        <Portal>
            <Dialog visible={dialogMensagemVisivel} onDismiss={() => setDialogMensagemVisivel(false)} style={{ zIndex: 9999 }}>
                <Dialog.Title>{mensagem.tipo === "erro" ? "Erro" : "Sucesso"}</Dialog.Title>
                <Dialog.Content><Text>{mensagem.mensagem}</Text></Dialog.Content>
                <Dialog.Actions><Button onPress={() => setDialogMensagemVisivel(false)}>OK</Button></Dialog.Actions>
            </Dialog>
        </Portal>
      </Modal>
    </Portal>
  );
}
