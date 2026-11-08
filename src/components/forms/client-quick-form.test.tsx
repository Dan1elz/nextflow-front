import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ClientQuickForm } from "@/components/forms/client-quick-form";

describe("ClientQuickForm", () => {
  it("envia o e-mail informado junto com nome e telefone", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ClientQuickForm onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("Telefone"), "11977123456");
    await user.type(screen.getByLabelText(/E-mail/), " ana@exemplo.com ");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Ana",
        phone: "11977123456",
        email: "ana@exemplo.com",
      })
    );
  });

  it("aceita sem e-mail e recusa e-mail inválido", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ClientQuickForm onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Nome"), "Bia");
    await user.type(screen.getByLabelText("Telefone"), "11977123456");
    await user.type(screen.getByLabelText(/E-mail/), "bia@");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));
    expect(
      await screen.findByText("Informe um e-mail válido.")
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/E-mail/));
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Bia",
        phone: "11977123456",
        email: null,
      })
    );
  });
});
