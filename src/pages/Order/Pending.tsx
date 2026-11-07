import { Link } from "react-router-dom";
import { ScanBarcode, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Vendas e orçamentos (T-VD3..T-VD6) entram na F2.5: a API v2 ainda não tem `/api/orders`. As telas legadas de pedido
 * chamavam esse endpoint e mostravam "Registro não encontrado"; até lá, as rotas de pedido caem aqui.
 */
export default function OrdersPendingPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShoppingCart />
          </EmptyMedia>
          <EmptyTitle>Pedidos e orçamentos em breve</EmptyTitle>
          <EmptyDescription>
            A lista de vendas, os orçamentos e o checkout chegam na próxima
            etapa. Por enquanto, as vendas de balcão são feitas pela venda
            rápida.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/sales/quick">
              <ScanBarcode />
              Ir para a venda rápida
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
