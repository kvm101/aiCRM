package vasyl.karpliak.aiCRM.attachments.service;

import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class FileTextExtractor {

    private final AutoDetectParser parser = new AutoDetectParser();

    public String extract(Path path) throws IOException {
        Metadata metadata = new Metadata();
        metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, path.getFileName().toString());
        try (InputStream stream = Files.newInputStream(path)) {
            BodyContentHandler handler = new BodyContentHandler(-1);
            try {
                parser.parse(stream, handler, metadata, new ParseContext());
            } catch (SAXException | TikaException e) {
                throw new IOException("Failed to parse document: " + path, e);
            }
            String text = handler.toString();
            return text == null ? "" : text.trim();
        }
    }
}