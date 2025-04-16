import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

type OrderInvoiceEmailProps = {
  order: {
    id: string;
    createdAt: Date;
    deliveryAddress: string;
    specialInstructions: string | null;
    subtotal: string;
    deliveryFee: string | null;
    total: string;
    user: {
      name: string;
      email: string;
    };
    orderItems: Array<{
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      menuItem: { name: string };
    }>;
  };
};

export function OrderInvoiceEmail({ order }: OrderInvoiceEmailProps) {
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html>
      <Head />
      <Preview>Restaurant Order Invoice #{order.id}</Preview>

      <Body style={main}>
        <Container style={container}>
          <Section>
            <Row>
              <Column>
                <Img
                  src={"https://restaurant-app.technodevlabs.com/logo.png"}
                  width="79"
                  height="92"
                  alt="Restaurant Logo"
                  className="rounded-full"
                />
              </Column>
              <Column align="right" style={tableCell}>
                <Text style={heading}>Invoice</Text>
              </Column>
            </Row>
          </Section>

          <Section style={informationTable}>
            <Row style={informationTableRow}>
              <Column colSpan={2}>
                <Section>
                  <Row>
                    <Column style={informationTableColumn}>
                      <Text style={informationTableLabel}>ORDER ID</Text>
                      <Text style={informationTableValue}>#{order.id}</Text>
                    </Column>
                  </Row>

                  <Row>
                    <Column style={informationTableColumn}>
                      <Text style={informationTableLabel}>ORDER DATE</Text>
                      <Text style={informationTableValue}>{orderDate}</Text>
                    </Column>
                  </Row>
                </Section>
              </Column>
              <Column style={informationTableColumn} colSpan={2}>
                <Text style={informationTableLabel}>DELIVERED TO</Text>
                <Text style={informationTableValue}>{order.user.name}</Text>
                <Text style={informationTableValue}>{order.deliveryAddress}</Text>
                {order.specialInstructions && (
                  <Text style={informationTableValue}>Note: {order.specialInstructions}</Text>
                )}
              </Column>
            </Row>
          </Section>

          <Section style={productTitleTable}>
            <Text style={productsTitle}>Order Items</Text>
          </Section>

          {order.orderItems.map(item => (
            <Section key={item.menuItem.name}>
              <Row>
                <Column style={productTitleColumn}>
                  <Text style={productTitle}>{item.menuItem.name}</Text>
                  <Text style={productDescription}>Quantity: {item.quantity}</Text>
                </Column>
                <Column style={productPriceWrapper} align="right">
                  <Text style={productPrice}>${Number(item.unitPrice).toFixed(2)} each</Text>
                  <Text style={productPriceTotal}>${Number(item.totalPrice).toFixed(2)}</Text>
                </Column>
              </Row>
            </Section>
          ))}

          <Hr style={productPriceLine} />

          <Section align="right">
            <Row>
              <Column style={tableCellNoBorder} align="right">
                <Text style={summaryLabel}>Subtotal</Text>
                <Text style={summaryLabel}>Delivery Fee</Text>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={productPriceLargeWrapper}>
                <Text style={summaryValue}>${Number(order.subtotal).toFixed(2)}</Text>
                <Text style={summaryValue}>${Number(order.deliveryFee).toFixed(2)}</Text>
                <Text style={totalValue}>${Number(order.total).toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={productPriceLineBottom} />

          <Text style={footerText}>
            Thank you for your order! If you have any questions or concerns, please don&apos;t
            hesitate to contact our customer support.
          </Text>

          <Text style={footerCopyright}>
            © {new Date().getFullYear()} <strong>Restaurant</strong>. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  backgroundColor: "#ffffff",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "660px",
};

const tableCell = {
  display: "table-cell",
  verticalAlign: "middle",
};

const tableCellNoBorder = {
  display: "table-cell",
  padding: "0px 20px 0px 0px",
};

const heading = {
  fontSize: "32px",
  fontWeight: "300",
  color: "#484848",
};

const informationTable = {
  borderCollapse: "collapse" as const,
  borderSpacing: "0px",
  color: "rgb(51,51,51)",
  backgroundColor: "rgb(250,250,250)",
  borderRadius: "3px",
  marginTop: "40px",
};

const informationTableRow = {
  height: "46px",
};

const informationTableColumn = {
  paddingLeft: "20px",
  borderStyle: "solid",
  borderColor: "white",
  borderWidth: "0px 1px 1px 0px",
  height: "44px",
};

const informationTableLabel = {
  color: "rgb(102,102,102)",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  margin: "0",
};

const informationTableValue = {
  fontSize: "12px",
  margin: "0",
  paddingTop: "4px",
};

const productTitleTable = {
  marginTop: "30px",
  marginBottom: "15px",
  height: "24px",
};

const productsTitle = {
  background: "#fafafa",
  paddingLeft: "10px",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const productTitle = {
  fontSize: "12px",
  fontWeight: "600",
  margin: "0",
};

const productDescription = {
  fontSize: "12px",
  color: "rgb(102,102,102)",
  margin: "0",
};

const productTitleColumn = {
  paddingLeft: "20px",
};

const productPrice = {
  fontSize: "12px",
  color: "rgb(102,102,102)",
  margin: "0",
};

const productPriceTotal = {
  fontSize: "12px",
  fontWeight: "600",
  margin: "0",
};

const productPriceWrapper = {
  display: "table-cell",
  padding: "0px 20px 0px 0px",
  width: "100px",
  verticalAlign: "top",
};

const productPriceLine = {
  margin: "30px 0 0 0",
};

const productPriceLargeWrapper = {
  display: "table-cell",
  width: "90px",
};

const productPriceLineBottom = {
  margin: "30px 0",
};

const summaryLabel = {
  fontSize: "12px",
  color: "rgb(102,102,102)",
  margin: "5px 0",
  textAlign: "right" as const,
};

const summaryValue = {
  fontSize: "12px",
  margin: "5px 0",
  textAlign: "right" as const,
  fontWeight: "500",
};

const totalLabel = {
  fontSize: "14px",
  color: "rgb(51,51,51)",
  margin: "5px 0",
  textAlign: "right" as const,
  fontWeight: "600",
};

const totalValue = {
  fontSize: "14px",
  margin: "5px 0",
  textAlign: "right" as const,
  fontWeight: "600",
};

const footerText = {
  fontSize: "12px",
  color: "rgb(102,102,102)",
  margin: "20px 0",
  textAlign: "center" as const,
  lineHeight: "1.5",
};

const footerCopyright = {
  margin: "25px 0 0 0",
  textAlign: "center" as const,
  fontSize: "12px",
  color: "rgb(102,102,102)",
};
