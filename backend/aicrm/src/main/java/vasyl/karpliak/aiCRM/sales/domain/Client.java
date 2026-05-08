package vasyl.karpliak.aiCRM.sales.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vasyl.karpliak.aiCRM.sales.enums.ClientStatus;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "client")
@Data
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "company", nullable = false)
    private String company;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ClientStatus status;

    @ElementCollection
    @CollectionTable(name = "client_notes", joinColumns = @JoinColumn(name = "client_id"))
    @Column(name = "note", nullable = false)
    private List<String> notes = new ArrayList<>();
}
